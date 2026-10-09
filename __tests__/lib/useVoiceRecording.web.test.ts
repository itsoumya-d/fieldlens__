import { act, renderHook } from '@testing-library/react-native';
import { Blob as NodeBlob } from 'node:buffer';
import { useVoiceRecording } from '@/lib/useVoiceRecording.web';

const mockInvoke = jest.fn();
jest.mock('@/lib/supabase', () => ({ supabase: { functions: { invoke: (...args: unknown[]) => mockInvoke(...args) } } }));
// Web must not construct the SDK recorder, request its permissions, or fetch blob URLs.
jest.mock('expo-audio', () => { throw new Error('Native audio must not load on web'); });
const original = Object.fromEntries(['navigator', 'MediaRecorder', 'isSecureContext', 'Blob', 'FileReader', 'fetch', 'addEventListener', 'removeEventListener', 'document'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
const mockAcquire = jest.fn();
const mockFetch = jest.fn();
const mockReaderAbort = jest.fn();
let events: Map<string, () => void>;
let documentEvents: Map<string, () => void>;
let tracks: { stop: jest.Mock }[];
let recorders: FakeRecorder[];
let delayedStop = false;
let delayedRead = false;
let readComplete: (() => void) | undefined;
class FakeRecorder {
  static isTypeSupported = jest.fn(() => true);
  state = 'inactive';
  mimeType = 'audio/webm;codecs=opus';
  ondataavailable: ((event: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  onerror: (() => void) | null = null;
  start = jest.fn(() => { this.state = 'recording'; });
  stop = jest.fn(() => { this.state = 'inactive'; if (!delayedStop) this.complete(); });
  constructor() { recorders.push(this); }
  complete() {
    this.ondataavailable?.({ data: new Blob(['synthetic'], { type: this.mimeType }) });
    this.onstop?.();
  }
}
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(res => { resolve = res; });
  return { promise, resolve };
}
function setup() {
  const onTranscript = jest.fn(), onError = jest.fn();
  return { ...renderHook(() => useVoiceRecording({ onTranscript, onError })), onTranscript, onError };
}
function stopped() { tracks.forEach(track => expect(track.stop).toHaveBeenCalledTimes(1)); }
beforeEach(() => {
  jest.clearAllMocks();
  tracks = [{ stop: jest.fn() }, { stop: jest.fn() }];
  recorders = [];
  events = new Map(); documentEvents = new Map();
  delayedStop = false; delayedRead = false; readComplete = undefined;
  FakeRecorder.isTypeSupported.mockReturnValue(true);
  mockAcquire.mockResolvedValue({ getTracks: () => tracks });
  mockInvoke.mockResolvedValue({ data: { text: 'fixture transcript' }, error: null });
  Object.defineProperties(globalThis, {
    addEventListener: { configurable: true, value: (name: string, cb: () => void) => events.set(name, cb) },
    removeEventListener: { configurable: true, value: (name: string) => events.delete(name) },
    document: { configurable: true, value: {
      visibilityState: 'visible',
      addEventListener: (name: string, cb: () => void) => documentEvents.set(name, cb),
      removeEventListener: (name: string) => documentEvents.delete(name),
    } },
    navigator: { configurable: true, value: { mediaDevices: { getUserMedia: mockAcquire } } },
    isSecureContext: { configurable: true, value: true },
    MediaRecorder: { configurable: true, value: FakeRecorder },
    Blob: { configurable: true, writable: true, value: NodeBlob },
    fetch: { configurable: true, writable: true, value: mockFetch },
    FileReader: { configurable: true, writable: true, value: class {
      result: string | null = null;
      onload?: () => void; onabort?: () => void;
      readAsDataURL() {
        readComplete = () => { this.result = 'data:audio/webm;base64,c3ludGhldGlj'; this.onload?.(); };
        if (!delayedRead) readComplete();
      }
      abort() { mockReaderAbort(); this.onabort?.(); }
    } },
  });
});
afterAll(() => {
  for (const [key, descriptor] of Object.entries(original)) {
    if (descriptor) Object.defineProperty(globalThis, key, descriptor);
    else Reflect.deleteProperty(globalThis, key);
  }
});

it('supports web without acquiring permission on mount and preserves MIME in one upload', async () => {
  const { result, onTranscript, onError } = setup();
  expect(result.current.blocked).toBe(false);
  expect(mockAcquire).not.toHaveBeenCalled();
  await act(async () => { await result.current.start(); });
  expect(result.current.recording).toBe(true);
  await act(async () => { await result.current.stop(); });
  stopped();
  expect(mockInvoke).toHaveBeenCalledWith('transcribe-audio', {
    body: { audioBase64: 'c3ludGhldGlj', mimeType: 'audio/webm;codecs=opus' }, signal: expect.anything(),
  });
  expect(onTranscript).toHaveBeenCalledWith('fixture transcript');
  expect(onError).not.toHaveBeenCalled();
  expect(mockFetch).not.toHaveBeenCalled();
  expect(result.current).toMatchObject({ busy: false, recording: false });
});

it('keeps unsupported environments blocked and ignores repeated Stop/Cancel/remount without access', async () => {
  Object.defineProperty(globalThis, 'isSecureContext', { configurable: true, value: false });
  const first = setup();
  await act(async () => { await first.result.current.start(); await first.result.current.stop(); first.result.current.cancel(); });
  expect(first.result.current.blocked).toBe(true);
  expect(first.onError).toHaveBeenCalledWith('unavailable');
  first.unmount();
  const second = setup();
  expect(second.result.current.blocked).toBe(true);
  expect(mockAcquire).not.toHaveBeenCalled();
});

it('permission denial is visible, with no recorder/provider, and retry remains available', async () => {
  mockAcquire.mockRejectedValueOnce(Object.assign(new Error('denied'), { name: 'NotAllowedError' }));
  const { result, onError } = setup();
  await act(async () => { await result.current.start(); });
  expect(onError).toHaveBeenCalledWith('permission');
  expect(recorders).toHaveLength(0);
  expect(mockInvoke).not.toHaveBeenCalled();
  await act(async () => { await result.current.start(); });
  expect(result.current.recording).toBe(true);
});

it('rapid Start, Cancel, Start keeps a pending acquisition locked and releases its late stream', async () => {
  const pending = deferred<MediaStream>();
  mockAcquire.mockReturnValue(pending.promise);
  const { result, onError } = setup();
  let start!: Promise<void>;
  act(() => { start = result.current.start(); void result.current.start(); result.current.cancel(); void result.current.start(); });
  expect(mockAcquire).toHaveBeenCalledTimes(1);
  await act(async () => { pending.resolve({ getTracks: () => tracks } as unknown as MediaStream); await start; });
  stopped();
  expect(recorders).toHaveLength(0);
  expect(onError).not.toHaveBeenCalled();
  expect(result.current.busy).toBe(false);
});

it('Stop during pending Start cancels and releases without recording', async () => {
  const pending = deferred<MediaStream>();
  mockAcquire.mockReturnValue(pending.promise);
  const { result } = setup();
  let start!: Promise<void>;
  act(() => { start = result.current.start(); void result.current.stop(); });
  await act(async () => { pending.resolve({ getTracks: () => tracks } as unknown as MediaStream); await start; });
  stopped();
  expect(recorders).toHaveLength(0);
});

it('duplicate Stop and Start cannot overlap an unfinished stop/transcription', async () => {
  delayedStop = true;
  const { result } = setup();
  await act(async () => { await result.current.start(); });
  let stop!: Promise<void>;
  act(() => { stop = result.current.stop(); void result.current.stop(); void result.current.start(); });
  stopped();
  expect(mockAcquire).toHaveBeenCalledTimes(1);
  expect(recorders[0].stop).toHaveBeenCalledTimes(1);
  await act(async () => { recorders[0].complete(); await stop; });
  expect(mockInvoke).toHaveBeenCalledTimes(1);
});

it.each(['recording', 'stopping', 'reading', 'transcribing'])('cancel during %s releases/aborts and suppresses late text', async stage => {
  const pending = deferred<{ data: { text: string }; error: null }>();
  if (stage === 'transcribing') mockInvoke.mockReturnValue(pending.promise);
  if (stage === 'stopping') delayedStop = true;
  if (stage === 'reading') delayedRead = true;
  const { result, onTranscript, onError } = setup();
  await act(async () => { await result.current.start(); });
  let stop: Promise<void> | undefined;
  if (stage !== 'recording') await act(async () => { stop = result.current.stop(); });
  act(() => { result.current.cancel(); result.current.cancel(); });
  stopped();
  if (stage === 'transcribing') expect(mockInvoke.mock.calls[0][1].signal.aborted).toBe(true);
  if (stage === 'reading') expect(mockReaderAbort).toHaveBeenCalledTimes(1);
  await act(async () => {
    recorders[0].complete(); readComplete?.();
    pending.resolve({ data: { text: 'late text' }, error: null });
    await stop;
  });
  expect(onTranscript).not.toHaveBeenCalled();
  expect(onError).not.toHaveBeenCalled();
  expect(result.current).toMatchObject({ recording: false, busy: false });
});

it.each(['starting', 'recording'])('unmount during %s releases even late media without callbacks', async stage => {
  const pending = deferred<MediaStream>();
  if (stage === 'starting') mockAcquire.mockReturnValue(pending.promise);
  const { result, unmount, onTranscript, onError } = setup();
  let start!: Promise<void>;
  await act(async () => { start = result.current.start(); if (stage === 'recording') await start; });
  unmount();
  await act(async () => { pending.resolve({ getTracks: () => tracks } as unknown as MediaStream); await start; });
  stopped();
  expect(onTranscript).not.toHaveBeenCalled(); expect(onError).not.toHaveBeenCalled();
  expect(mockInvoke).not.toHaveBeenCalled();
});

it('reports an unexpected recorder error once, releases, and returns to idle', async () => {
  const { result, onError } = setup();
  await act(async () => { await result.current.start(); });
  act(() => { recorders[0].onerror?.(); });
  stopped();
  expect(onError).toHaveBeenCalledTimes(1);
  expect(onError).toHaveBeenCalledWith('transcription');
  expect(result.current).toMatchObject({ recording: false, busy: false });
});

it.each([{ data: null, error: Error('provider') }, { data: { text: '' }, error: null }])('reports invalid transcription without stale text', async response => {
  mockInvoke.mockResolvedValue(response);
  const { result, onError, onTranscript } = setup();
  await act(async () => { await result.current.start(); await result.current.stop(); });
  stopped();
  expect(onError).toHaveBeenCalledWith('transcription'); expect(onTranscript).not.toHaveBeenCalled();
});


it.each(['pagehide', 'hidden'])('releases capture on browser %s and removes lifecycle listeners', async event => {
  const { result, unmount, onTranscript } = setup();
  await act(async () => { await result.current.start(); });
  act(() => {
    if (event === 'pagehide') events.get('pagehide')!();
    else {
      Object.defineProperty(document, 'visibilityState', { value: 'hidden' });
      documentEvents.get('visibilitychange')!();
    }
  });
  stopped();
  expect(result.current.recording).toBe(false);
  expect(onTranscript).not.toHaveBeenCalled();
  unmount();
  expect(events.size).toBe(0); expect(documentEvents.size).toBe(0);
});
