import assert from 'node:assert/strict';
import { test } from 'node:test';
import { browserRecordingMimeType, createBrowserVoiceRecorder } from '../lib/browserVoiceRecorder.ts';

function deferred() {
  let resolve, reject;
  const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}
function fixture(options = {}) {
  const tracks = Array.from({ length: 2 }, () => ({ stopped: 0, stop() { this.stopped++; } }));
  const stream = { getTracks: () => tracks };
  const instances = [];
  let acquired = 0, failures = 0;
  class Recorder {
    static isTypeSupported(mime) { return options.supported ? options.supported.includes(mime) : true; }
    state = 'inactive';
    mimeType = options.actualMime || 'audio/webm;codecs=opus';
    ondataavailable = null; onstop = null; onerror = null;
    starts = 0; stops = 0;
    constructor(_stream, { mimeType }) {
      if (options.constructError) throw Error('constructor failed');
      this.requestedMime = mimeType;
      instances.push(this);
    }
    start() {
      this.starts++;
      if (options.startError) throw Error('start failed');
      this.state = 'recording';
    }
    stop() {
      this.stops++;
      if (options.stopError) throw Error('stop failed');
      this.state = 'inactive';
      if (!options.delayStop) this.complete();
    }
    complete() {
      this.ondataavailable?.({ data: new Blob([options.empty ? '' : 'synthetic fixture'], { type: this.mimeType }) });
      this.onstop?.();
    }
  }
  const env = {
    secure: options.secure ?? true,
    Recorder,
    getUserMedia: (constraints) => {
      acquired++;
      assert.deepEqual(constraints, { audio: true });
      return options.acquire ? options.acquire() : Promise.resolve(stream);
    },
  };
  const recording = createBrowserVoiceRecorder(() => { failures++; }, env);
  return { recording, env, tracks, stream, instances, acquired: () => acquired, failures: () => failures };
}
function released(f, count = 1) { assert.deepEqual(f.tracks.map(t => t.stopped), [count, count]); }

for (const missing of ['secure', 'getUserMedia', 'Recorder', 'codec']) {
  test(`unsupported ${missing} fails before any microphone acquisition`, async () => {
    const f = fixture({ supported: missing === 'codec' ? [] : undefined });
    if (missing !== 'codec') f.env[missing] = missing === 'secure' ? false : null;
    assert.equal(browserRecordingMimeType(f.env), null);
    await assert.rejects(f.recording.start());
    assert.equal(f.acquired(), 0);
    released(f, 0);
  });
}

test('acquires only on Start, releases all tracks synchronously on Stop, waits for final data', async () => {
  const f = fixture({ delayStop: true });
  assert.equal(f.acquired(), 0);
  await f.recording.start();
  assert.equal(f.instances[0].starts, 1);
  const result = f.recording.stop();
  released(f);
  assert.equal(f.recording.stop(), result);
  f.instances[0].complete();
  const blob = await result;
  assert.equal(blob.type, 'audio/webm;codecs=opus');
  assert.equal(await blob.text(), 'synthetic fixture');
  f.recording.cancel(); f.recording.cancel();
  released(f);
  assert.equal(f.instances[0].stops, 1);
  assert.equal(f.instances[0].onstop, null);
});

test('cancellation before permission resolves releases the late stream without constructing/starting', async () => {
  const permission = deferred();
  const f = fixture({ acquire: () => permission.promise });
  const started = f.recording.start();
  f.recording.cancel(); f.recording.cancel();
  permission.resolve(f.stream);
  await assert.rejects(started);
  released(f);
  assert.equal(f.instances.length, 0);
  assert.equal(f.failures(), 0);
});

test('permission denial and cancellation-before-start do not acquire unused streams', async () => {
  const f = fixture({ acquire: () => Promise.reject(Object.assign(Error('denied'), { name: 'NotAllowedError' })) });
  await assert.rejects(f.recording.start(), { name: 'NotAllowedError' });
  released(f, 0);
  const cancelled = fixture();
  cancelled.recording.cancel();
  await assert.rejects(cancelled.recording.start());
  assert.equal(cancelled.acquired(), 0);
});

for (const failure of ['constructError', 'startError', 'stopError']) {
  test(`${failure} releases each acquired track even when the recorder cannot stop`, async () => {
    const f = fixture({ [failure]: true });
    if (failure === 'stopError') {
      await f.recording.start();
      await assert.rejects(f.recording.stop());
    } else await assert.rejects(f.recording.start());
    released(f);
    f.recording.cancel();
    released(f);
  });
}

for (const event of ['onerror', 'onstop']) {
  test(`unexpected ${event} releases capture, notifies once, discards audio`, async () => {
    const f = fixture();
    await f.recording.start();
    const callback = f.instances[0][event];
    callback(); callback();
    released(f);
    assert.equal(f.failures(), 1);
    await assert.rejects(f.recording.stop());
  });
}

test('Cancel while Stop waits discards late events and resolves cleanup independently', async () => {
  const f = fixture({ delayStop: true });
  await f.recording.start();
  const lateData = f.instances[0].ondataavailable, lateStop = f.instances[0].onstop;
  const result = f.recording.stop();
  f.recording.cancel();
  lateData({ data: new Blob(['discarded'], { type: 'audio/webm' }) }); lateStop();
  await assert.rejects(result);
  released(f);
  assert.equal(f.failures(), 0);
});

test('stop-event timeout cannot retain capture or leave a permanently pending result', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const f = fixture({ delayStop: true });
  await f.recording.start();
  const result = f.recording.stop();
  released(f);
  t.mock.timers.tick(5000);
  await assert.rejects(result, /did not finish/);
  assert.equal(f.instances[0].onstop, null);
});

for (const options of [{ empty: true }, { actualMime: 'video/webm' }, { actualMime: 'audio/ogg' }]) {
  test(`rejects empty/unsupported output ${JSON.stringify(options)} after release`, async () => {
    const f = fixture(options);
    await f.recording.start();
    await assert.rejects(f.recording.stop());
    released(f);
  });
}

test('MP4 fallback passes the actual MIME, with no object URL allocation', async (t) => {
  const urls = t.mock.method(URL, 'createObjectURL', () => { throw Error('No object URL should be allocated'); });
  const f = fixture({ supported: ['audio/mp4'], actualMime: 'audio/mp4;codecs=mp4a.40.2' });
  await f.recording.start();
  assert.equal(urls.mock.callCount(), 0);
  assert.equal(f.instances[0].requestedMime, 'audio/mp4');
  assert.equal((await f.recording.stop()).type, 'audio/mp4;codecs=mp4a.40.2');
  released(f);
});

test('duplicate Start is rejected; repeated sessions release their own tracks only', async () => {
  for (let i = 0; i < 12; i++) {
    const f = fixture();
    const first = f.recording.start();
    await assert.rejects(f.recording.start());
    await first;
    if (i % 2) f.recording.cancel(); else await f.recording.stop();
    released(f);
    assert.equal(f.acquired(), 1);
  }
});
