import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createOfflineQueue } from '../lib/offlineQueue.ts';

const KEY = '@offline_sync_queue';

function deferred() {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
}

function fixture() {
  const values = new Map();
  const storage = {
    async getItem(key) { return values.get(key) ?? null; },
    async setItem(key, value) { values.set(key, value); },
    async removeItem(key) { values.delete(key); },
  };
  let online = true;
  const isOnline = async () => online;
  const queue = createOfflineQueue(storage, isOnline);
  return { queue, storage, values, isOnline, setOnline(value) { online = value; } };
}

const add = (queue, name) => queue.enqueueOperation('create', 'tasks', { name });
const names = (operations) => operations.map((op) => op.payload.name);

// All fixtures use JSON storage, not shared object references, so persistence is tested.
test('concurrent enqueues retain every operation in call order', async () => {
  const { queue } = fixture();
  await Promise.all(['a', 'b', 'c'].map((name) => add(queue, name)));
  const pending = await queue.getQueue();
  assert.deepEqual(names(pending), ['a', 'b', 'c']);
  assert.equal(new Set(pending.map((op) => op.id)).size, 3);
  assert.ok(pending.every((op) => op.retries === 0));
});

test('concurrent enqueue and removal neither lose nor resurrect work', async () => {
  const { queue } = fixture();
  await add(queue, 'old');
  const [old] = await queue.getQueue();
  await Promise.all([add(queue, 'new'), queue.dequeueOperation(old.id)]);
  assert.deepEqual(names(await queue.getQueue()), ['new']);
});

test('concurrent removals do not restore an already removed operation', async () => {
  const { queue } = fixture();
  await add(queue, 'a');
  await add(queue, 'b');
  const [a, b] = await queue.getQueue();
  await Promise.all([queue.dequeueOperation(a.id), queue.dequeueOperation(b.id)]);
  assert.deepEqual(await queue.getQueue(), []);
});

test('clear is ordered after pending writes and before later enqueues', async () => {
  const { queue, storage } = fixture();
  const entered = deferred();
  const release = deferred();
  const setItem = storage.setItem;
  storage.setItem = async (...args) => {
    entered.resolve();
    await release.promise;
    return setItem(...args);
  };
  const first = add(queue, 'before-clear');
  await entered.promise;
  const clear = queue.clearQueue();
  const last = add(queue, 'after-clear');
  release.resolve();
  await Promise.all([first, clear, last]);
  assert.deepEqual(names(await queue.getQueue()), ['after-clear']);
});

test('false and thrown sync failures persist retries across queue recreation', async () => {
  const { queue, storage, isOnline } = fixture();
  await add(queue, 'false');
  await add(queue, 'throw');
  const result = await queue.processQueue(async (op) => {
    if (op.payload.name === 'throw') throw new Error('network interrupted');
    return false;
  });
  assert.deepEqual(result, { synced: 0, failed: 2 });
  const restarted = createOfflineQueue(storage, isOnline);
  assert.deepEqual((await restarted.getQueue()).map((op) => op.retries), [1, 1]);
  await restarted.processQueue(async () => false);
  assert.deepEqual((await queue.getQueue()).map((op) => op.retries), [2, 2]);
});

test('successful sync removes only successes and retains persisted failures', async () => {
  const { queue } = fixture();
  await add(queue, 'success');
  await add(queue, 'failure');
  assert.deepEqual(await queue.processQueue(async (op) => op.payload.name === 'success'),
    { synced: 1, failed: 1 });
  const remaining = await queue.getQueue();
  assert.deepEqual(names(remaining), ['failure']);
  assert.equal(remaining[0].retries, 1);
});

test('enqueues during a sync handler survive successful acknowledgement', async () => {
  const { queue } = fixture();
  await add(queue, 'original');
  const seen = [];
  await queue.processQueue(async (op) => {
    seen.push(op.payload.name);
    await add(queue, 'new');
    return true;
  });
  assert.deepEqual(seen, ['original']);
  assert.deepEqual(names(await queue.getQueue()), ['new']);
});

test('failure persistence retains enqueues made during the handler', async () => {
  const { queue } = fixture();
  await add(queue, 'original');
  await queue.processQueue(async () => {
    await add(queue, 'new');
    return false;
  });
  const remaining = await queue.getQueue();
  assert.deepEqual(names(remaining), ['original', 'new']);
  assert.deepEqual(remaining.map((op) => op.retries), [1, 0]);
});

test('overlapping sync calls share one pass and the first handler', async () => {
  const { queue } = fixture();
  await add(queue, 'original');
  const entered = deferred();
  const release = deferred();
  let calls = 0;
  const first = queue.processQueue(async () => {
    calls++;
    entered.resolve();
    await release.promise;
    return true;
  });
  await entered.promise;
  const second = queue.processQueue(async () => { calls++; return true; });
  // Drain scheduled promise continuations while the first handler stays blocked.
  await new Promise(setImmediate);
  release.resolve();
  assert.deepEqual(await first, { synced: 1, failed: 0 });
  assert.deepEqual(await second, { synced: 1, failed: 0 });
  assert.equal(calls, 1);
  assert.deepEqual(await queue.getQueue(), []);
});

test('repeated successful sync does not resend acknowledged work', async () => {
  const { queue } = fixture();
  await add(queue, 'original');
  let calls = 0;
  const handler = async () => { calls++; return true; };
  await queue.processQueue(handler);
  assert.deepEqual(await queue.processQueue(handler), { synced: 0, failed: 0 });
  assert.equal(calls, 1);
});

test('offline sync leaves stored operations and retry counts untouched', async () => {
  const { queue, values, setOnline } = fixture();
  await add(queue, 'original');
  const before = values.get(KEY);
  setOnline(false);
  let calls = 0;
  assert.deepEqual(await queue.processQueue(async () => { calls++; return true; }),
    { synced: 0, failed: 0 });
  assert.equal(calls, 0);
  assert.equal(values.get(KEY), before);
  setOnline(true);
  assert.deepEqual(await queue.processQueue(async () => true), { synced: 1, failed: 0 });
});

test('removed snapshot entries are skipped before their handler starts', async () => {
  const { queue } = fixture();
  await add(queue, 'a');
  await add(queue, 'b');
  const [, b] = await queue.getQueue();
  const seen = [];
  await queue.processQueue(async (op) => {
    seen.push(op.payload.name);
    await queue.dequeueOperation(b.id);
    return true;
  });
  assert.deepEqual(seen, ['a']);
});

test('clearing during an in-flight failure does not restore cleared operations', async () => {
  const { queue } = fixture();
  await add(queue, 'a');
  await add(queue, 'b');
  const seen = [];
  await queue.processQueue(async (op) => {
    seen.push(op.payload.name);
    await queue.clearQueue();
    await add(queue, 'new');
    return false;
  });
  assert.deepEqual(seen, ['a']);
  assert.deepEqual(names(await queue.getQueue()), ['new']);
});

test('a failed storage read is surfaced without overwriting stored work', async () => {
  const { queue, storage, values } = fixture();
  await add(queue, 'original');
  const before = values.get(KEY);
  const getItem = storage.getItem;
  storage.getItem = async () => { throw new Error('storage unavailable'); };
  await assert.rejects(add(queue, 'lost'), /storage unavailable/);
  assert.equal(values.get(KEY), before);
  storage.getItem = getItem;
  await add(queue, 'recovered');
  assert.deepEqual(names(await queue.getQueue()), ['original', 'recovered']);
});

test('invalid stored JSON is surfaced without replacing it with an empty queue', async () => {
  const { queue, values } = fixture();
  values.set(KEY, '{broken');
  await assert.rejects(add(queue, 'new'));
  assert.equal(values.get(KEY), '{broken');
});

test('invalid stored queue shape is surfaced without replacing it', async () => {
  const { queue, values } = fixture();
  const raw = JSON.stringify([{ id: 'missing-fields' }]);
  values.set(KEY, raw);
  await assert.rejects(queue.dequeueOperation('missing-fields'), /Invalid offline queue/);
  assert.equal(values.get(KEY), raw);
});

test('a failed write rejects only that mutation and later writes can proceed', async () => {
  const { queue, storage } = fixture();
  const setItem = storage.setItem;
  storage.setItem = async () => { throw new Error('disk full'); };
  await assert.rejects(add(queue, 'not-persisted'), /disk full/);
  storage.setItem = setItem;
  await add(queue, 'recovered');
  assert.deepEqual(names(await queue.getQueue()), ['recovered']);
});

test('failed retry persistence interrupts the pass and releases the sync guard', async () => {
  const { queue, storage } = fixture();
  await add(queue, 'a');
  await add(queue, 'b');
  const setItem = storage.setItem;
  storage.setItem = async () => { throw new Error('disk full'); };
  const seen = [];
  await assert.rejects(queue.processQueue(async (op) => {
    seen.push(op.payload.name);
    return false;
  }), /disk full/);
  assert.deepEqual(seen, ['a']);
  storage.setItem = setItem;
  assert.deepEqual(await queue.processQueue(async () => true), { synced: 2, failed: 0 });
});

test('remote success before a failed local acknowledgement remains retryable', async () => {
  const { queue, storage, isOnline } = fixture();
  await add(queue, 'a');
  await add(queue, 'b');
  const [a, b] = await queue.getQueue();
  const setItem = storage.setItem;
  storage.setItem = async () => { throw new Error('interrupted acknowledgement'); };
  const sent = [];
  await assert.rejects(queue.processQueue(async (op) => {
    sent.push(op.id);
    return true;
  }), /interrupted acknowledgement/);
  assert.deepEqual(sent, [a.id]);
  storage.setItem = setItem;
  const restarted = createOfflineQueue(storage, isOnline);
  assert.deepEqual(await restarted.processQueue(async (op) => {
    sent.push(op.id);
    return true;
  }), { synced: 2, failed: 0 });
  // This is deliberately NOT an exactly-once guarantee: the first send repeats.
  assert.deepEqual(sent, [a.id, a.id, b.id]);
  assert.deepEqual(await restarted.getQueue(), []);
});

test('network status failure releases the guard for a later attempt', async () => {
  const { storage } = fixture();
  let fail = true;
  const queue = createOfflineQueue(storage, async () => {
    if (fail) throw new Error('network status unavailable');
    return true;
  });
  await add(queue, 'a');
  await assert.rejects(queue.processQueue(async () => true), /network status unavailable/);
  fail = false;
  assert.deepEqual(await queue.processQueue(async () => true), { synced: 1, failed: 0 });
});

test('an interrupted later read preserves the successfully acknowledged prefix', async () => {
  const { queue, storage, isOnline } = fixture();
  await add(queue, 'a');
  await add(queue, 'b');
  const getItem = storage.getItem;
  const setItem = storage.setItem;
  let failRead = false;
  storage.getItem = async (...args) => {
    if (failRead) throw new Error('read interrupted');
    return getItem(...args);
  };
  storage.setItem = async (...args) => {
    await setItem(...args);
    failRead = true;
  };
  const sent = [];
  await assert.rejects(queue.processQueue(async (op) => {
    sent.push(op.payload.name);
    return true;
  }), /read interrupted/);
  assert.deepEqual(sent, ['a']);
  storage.getItem = getItem;
  storage.setItem = setItem;
  const restarted = createOfflineQueue(storage, isOnline);
  assert.deepEqual(names(await restarted.getQueue()), ['b']);
  await restarted.processQueue(async (op) => { sent.push(op.payload.name); return true; });
  assert.deepEqual(sent, ['a', 'b']);
});

test('a failed clear preserves the queue and releases the mutation lock', async () => {
  const { queue, storage } = fixture();
  await add(queue, 'a');
  const removeItem = storage.removeItem;
  storage.removeItem = async () => { throw new Error('clear interrupted'); };
  await assert.rejects(queue.clearQueue(), /clear interrupted/);
  assert.deepEqual(names(await queue.getQueue()), ['a']);
  storage.removeItem = removeItem;
  await queue.clearQueue();
  await add(queue, 'b');
  assert.deepEqual(names(await queue.getQueue()), ['b']);
});

test('sync coalesces while the initial connectivity check is pending', async () => {
  const { storage } = fixture();
  const release = deferred();
  let checks = 0;
  const queue = createOfflineQueue(storage, async () => {
    checks++;
    await release.promise;
    return true;
  });
  await add(queue, 'a');
  let calls = 0;
  const first = queue.processQueue(async () => { calls++; return true; });
  const second = queue.processQueue(async () => { calls++; return true; });
  assert.equal(checks, 1);
  assert.equal(first, second);
  release.resolve();
  await Promise.all([first, second]);
  assert.equal(calls, 1);
});
