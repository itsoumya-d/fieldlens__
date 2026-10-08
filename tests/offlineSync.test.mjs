import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { createOfflineQueue } from '../lib/offlineQueue.ts';
import { createOfflineSyncHandler } from '../lib/offlineSync.ts';

function fakeClient(reply = async () => ({ error: null })) {
  const calls = [];
  const client = {
    from(table) {
      return {
        insert(payload) {
          calls.push({ type: 'create', table, payload });
          return reply();
        },
        update(payload) {
          return { eq(column, id) {
            calls.push({ type: 'update', table, payload, column, id });
            return reply();
          } };
        },
        delete() {
          return { eq(column, id) {
            calls.push({ type: 'delete', table, column, id });
            return reply();
          } };
        },
      };
    },
  };
  return { client, calls, handler: createOfflineSyncHandler(client) };
}

function operation(type, payload = { id: 'row-1', name: 'task' }) {
  return { id: 'queue-1', type, table: 'tasks', payload,
    retries: 0, createdAt: '2026-01-01T00:00:00.000Z' };
}

function queueFixture() {
  const values = new Map();
  return createOfflineQueue({
    async getItem(key) { return values.get(key) ?? null; },
    async setItem(key, value) { values.set(key, value); },
    async removeItem(key) { values.delete(key); },
  }, async () => true);
}

test('create sends the whole payload to the queued table', async () => {
  const { handler, calls } = fakeClient();
  const op = operation('create');
  assert.equal(await handler(op), true);
  assert.deepEqual(calls, [{ type: 'create', table: 'tasks', payload: op.payload }]);
});

test('update filters by id, omits id from updated data, and preserves input', async () => {
  const { handler, calls } = fakeClient();
  const op = operation('update');
  assert.equal(await handler(op), true);
  assert.deepEqual(calls, [{ type: 'update', table: 'tasks', column: 'id', id: 'row-1', payload: { name: 'task' } }]);
  assert.deepEqual(op.payload, { id: 'row-1', name: 'task' });
});

test('delete filters by the queued id, including numeric ids', async () => {
  const { handler, calls } = fakeClient();
  assert.equal(await handler(operation('delete', { id: 0 })), true);
  assert.deepEqual(calls, [{ type: 'delete', table: 'tasks', column: 'id', id: 0 }]);
});

test('update and delete with missing/invalid ids fail without a write', async () => {
  const { handler, calls } = fakeClient();
  for (const type of ['update', 'delete']) {
    for (const id of [undefined, null, '', {}, [], NaN, Infinity]) {
      assert.equal(await handler(operation(type, { id })), false);
    }
  }
  assert.deepEqual(calls, []);
});

test('returned provider errors and thrown requests fail all supported types', async () => {
  for (const reply of [
    async () => ({ error: { message: 'request rejected' } }),
    async () => { throw new Error('network interrupted'); },
  ]) {
    const { handler } = fakeClient(reply);
    for (const type of ['create', 'update', 'delete']) {
      assert.equal(await handler(operation(type)), false);
    }
  }
});

test('failed create/update/delete requests remain queued with persisted retries', async () => {
  const queue = queueFixture();
  const { handler } = fakeClient(async () => ({ error: { message: 'unavailable' } }));
  for (const type of ['create', 'update', 'delete']) {
    await queue.enqueueOperation(type, 'tasks', { id: 'row-1' });
  }
  assert.deepEqual(await queue.processQueue(handler), { synced: 0, failed: 3 });
  assert.deepEqual((await queue.getQueue()).map((op) => [op.type, op.retries]),
    [['create', 1], ['update', 1], ['delete', 1]]);
});

test('shared handler syncs all operation types once regardless of caller order', async () => {
  for (const firstCaller of ['reconnect', 'banner']) {
    const queue = queueFixture();
    let release;
    const gate = new Promise((resolve) => { release = resolve; });
    const { handler, calls } = fakeClient(async () => { await gate; return { error: null }; });
    const callers = { reconnect: () => queue.processQueue(handler), banner: () => queue.processQueue(handler) };
    for (const type of ['create', 'update', 'delete']) {
      await queue.enqueueOperation(type, 'tasks', { id: 'row-1', name: 'task' });
    }
    const first = callers[firstCaller]();
    const second = callers[firstCaller === 'banner' ? 'reconnect' : 'banner']();
    assert.equal(first, second);
    release();
    assert.deepEqual(await first, { synced: 3, failed: 0 });
    assert.deepEqual(await second, { synced: 3, failed: 0 });
    assert.deepEqual(calls.map((call) => call.type), ['create', 'update', 'delete']);
    assert.deepEqual(await queue.getQueue(), []);
  }
});

test('both app entry points are wired to the same exported sync handler', () => {
  // A source-wiring guard, not a React rendering test: prevents the original
  // create-only layout handler from silently diverging from the banner again.
  const sources = [
    ['../app/(tabs)/_layout.tsx', /useAutoSync\(syncQueuedOperation\)/],
    ['../components/OfflineBanner.tsx', /processQueue\(syncQueuedOperation\)/],
  ];
  for (const [path, call] of sources) {
    const source = readFileSync(new URL(path, import.meta.url), 'utf8');
    assert.match(source, /import\s*\{\s*syncQueuedOperation\s*\}\s*from ['"]@\/lib\/syncQueuedOperation['"]/);
    assert.match(source, call);
    assert.doesNotMatch(source, /supabase\.from\(op\.table\)/);
  }
});
