import { act, renderHook } from '@testing-library/react-native';
import { Platform } from 'react-native';
import { useVoiceRecording } from '@/lib/useVoiceRecording';

// Deliberate unit mocks: these tests do not exercise a device microphone or provider.
const mockRecorder = {
  prepareToRecordAsync: jest.fn(),
  record: jest.fn(),
  stop: jest.fn(),
  release: jest.fn(),
  uri: 'file:///voice.m4a' as string | null,
};
const mockPermission = jest.fn();
const mockSetMode = jest.fn();
const mockInvoke = jest.fn();
const mockFetch = jest.fn();
const mockRead = jest.fn();
let mockRecordingListener: ((status: { hasError: boolean }) => void) | undefined;

jest.mock('expo-audio', () => ({
  RecordingPresets: { HIGH_QUALITY: { web: { mimeType: 'audio/webm' } } },
  requestRecordingPermissionsAsync: (...args: unknown[]) => mockPermission(...args),
  setAudioModeAsync: (...args: unknown[]) => mockSetMode(...args),
  useAudioRecorder: (_options: unknown, listener: typeof mockRecordingListener) => {
    mockRecordingListener = listener;
    // Model the SDK hook's automatic release so cleanup ordering is observable.
    require('react').useEffect(() => () => mockRecorder.release(), []);
    return mockRecorder;
  },
}));
jest.mock('@/lib/supabase', () => ({
  supabase: { functions: { invoke: (...args: unknown[]) => mockInvoke(...args) } },
}));

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

const originalFetch = global.fetch;
const originalReader = global.FileReader;
const originalPlatform = Platform.OS;

beforeEach(() => {
  jest.resetAllMocks();
  Object.defineProperty(Platform, 'OS', { configurable: true, value: 'ios' });
  mockPermission.mockResolvedValue({ granted: true });
  mockSetMode.mockResolvedValue(undefined);
  mockRecorder.prepareToRecordAsync.mockResolvedValue(undefined);
  mockRecorder.stop.mockResolvedValue(undefined);
  mockRecorder.uri = 'file:///voice.m4a';
  mockInvoke.mockResolvedValue({ data: { text: '  repair a sink  ' }, error: null });
  mockFetch.mockResolvedValue({ blob: async () => ({ type: '' }) });
  global.fetch = mockFetch;
  global.FileReader = class {
    result: string | null = null;
    onload?: () => void;
    onerror?: () => void;
    onabort?: () => void;
    readAsDataURL(blob: Blob) {
      mockRead(blob);
      this.result = 'data:audio/m4a;base64,YXVkaW8=';
      this.onload?.();
    }
    abort() { this.onabort?.(); }
  } as unknown as typeof FileReader;
});

afterAll(() => {
  global.fetch = originalFetch;
  global.FileReader = originalReader;
  Object.defineProperty(Platform, 'OS', { configurable: true, value: originalPlatform });
});

function setup() {
  const onTranscript = jest.fn();
  const onError = jest.fn();
  return { ...renderHook(() => useVoiceRecording({ onTranscript, onError })), onTranscript, onError };
}

it('requests no microphone access on mount; denial leaves the recorder idle', async () => {
  mockPermission.mockResolvedValue({ granted: false });
  const { result, onError } = setup();
  expect(mockPermission).not.toHaveBeenCalled();
  await act(async () => { await result.current.start(); });
  expect(onError).toHaveBeenCalledWith('permission');
  expect(mockSetMode).not.toHaveBeenCalled();
  expect(mockRecorder.prepareToRecordAsync).not.toHaveBeenCalled();
  expect(result.current).toMatchObject({ recording: false, busy: false });
});

it('prepares before recording, then stops, resets audio mode, and transcribes the URI', async () => {
  const { result, onTranscript, onError } = setup();
  await act(async () => { await result.current.start(); });
  expect(result.current.recording).toBe(true);
  expect(mockSetMode).toHaveBeenNthCalledWith(1, { allowsRecording: true, playsInSilentMode: true });
  expect(mockRecorder.prepareToRecordAsync.mock.invocationCallOrder[0])
    .toBeLessThan(mockRecorder.record.mock.invocationCallOrder[0]);
  await act(async () => { await result.current.stop(); });
  expect(mockRecorder.stop).toHaveBeenCalledTimes(1);
  expect(mockSetMode).toHaveBeenLastCalledWith({ allowsRecording: false });
  expect(mockFetch).toHaveBeenCalledWith('file:///voice.m4a', { signal: expect.anything() });
  expect(mockInvoke).toHaveBeenCalledWith('transcribe-audio', {
    body: { audioBase64: 'YXVkaW8=', mimeType: 'audio/m4a' }, signal: expect.anything(),
  });
  expect(onTranscript).toHaveBeenCalledWith('  repair a sink  ');
  expect(onError).not.toHaveBeenCalled();
  expect(result.current).toMatchObject({ recording: false, busy: false });
});

it('preserves the native Blob audio MIME in the transcription payload', async () => {
  mockFetch.mockResolvedValue({ blob: async () => ({ type: 'audio/mp4' }) });
  const { result } = setup();
  await act(async () => { await result.current.start(); await result.current.stop(); });
  expect(mockInvoke.mock.calls[0][1].body.mimeType).toBe('audio/mp4');
});

function expectNoWebRecordingAcquisition() {
  expect(mockPermission).not.toHaveBeenCalled();
  expect(mockSetMode).not.toHaveBeenCalled();
  expect(mockRecorder.prepareToRecordAsync).not.toHaveBeenCalled();
  expect(mockRecorder.record).not.toHaveBeenCalled();
  expect(mockRecorder.stop).not.toHaveBeenCalled();
  expect(mockFetch).not.toHaveBeenCalled();
  expect(mockInvoke).not.toHaveBeenCalled();
}

it('marks web voice unavailable on mount before any permission or recording operation', () => {
  Object.defineProperty(Platform, 'OS', { configurable: true, value: 'web' });
  const { result, onError, onTranscript } = setup();
  expect(result.current).toMatchObject({ blocked: true, busy: false, recording: false });
  expectNoWebRecordingAcquisition();
  expect(onError).not.toHaveBeenCalled();
  expect(onTranscript).not.toHaveBeenCalled();
});

it('guards duplicate Start taps before a permission response', async () => {
  const permission = deferred<{ granted: boolean }>();
  mockPermission.mockReturnValue(permission.promise);
  const { result } = setup();
  let first!: Promise<void>;
  act(() => { first = result.current.start(); void result.current.start(); });
  expect(mockPermission).toHaveBeenCalledTimes(1);
  expect(result.current.busy).toBe(true);
  await act(async () => { permission.resolve({ granted: true }); await first; });
  expect(mockRecorder.record).toHaveBeenCalledTimes(1);
});

it('guards duplicate Stop and Start while stopping/transcribing', async () => {
  const stopped = deferred<void>();
  mockRecorder.stop.mockReturnValue(stopped.promise);
  const { result } = setup();
  await act(async () => { await result.current.start(); });
  let first!: Promise<void>;
  act(() => {
    first = result.current.stop();
    void result.current.stop();
    void result.current.start();
  });
  expect(mockRecorder.stop).toHaveBeenCalledTimes(1);
  expect(mockPermission).toHaveBeenCalledTimes(1);
  expect(result.current).toMatchObject({ recording: false, busy: true });
  await act(async () => { stopped.resolve(); await first; });
  expect(mockInvoke).toHaveBeenCalledTimes(1);
});

it('resets audio mode after native prepare failure and permits retry', async () => {
  mockRecorder.prepareToRecordAsync.mockRejectedValueOnce(new Error('prepare failed'));
  const { result, onError } = setup();
  await act(async () => { await result.current.start(); });
  expect(onError).toHaveBeenCalledWith('start');
  expect(mockRecorder.record).not.toHaveBeenCalled();
  expect(mockSetMode).toHaveBeenLastCalledWith({ allowsRecording: false });
  expect(result.current.busy).toBe(false);
  await act(async () => { await result.current.start(); });
  expect(result.current.recording).toBe(true);
});

it('cleans a prepared recorder if record throws', async () => {
  mockRecorder.record.mockImplementationOnce(() => { throw new Error('record failed'); });
  const { result, onError } = setup();
  await act(async () => { await result.current.start(); });
  expect(mockRecorder.stop).toHaveBeenCalledTimes(1);
  expect(mockSetMode).toHaveBeenLastCalledWith({ allowsRecording: false });
  expect(onError).toHaveBeenCalledWith('start');
});

it('resets audio mode after stop failure without uploading stale audio', async () => {
  mockRecorder.stop.mockRejectedValueOnce(new Error('stop failed'));
  const { result, onError } = setup();
  await act(async () => { await result.current.start(); await result.current.stop(); });
  expect(mockSetMode).toHaveBeenLastCalledWith({ allowsRecording: false });
  expect(onError).toHaveBeenCalledWith('transcription');
  expect(mockRecorder.stop).toHaveBeenCalledTimes(2);
  expect(mockFetch).not.toHaveBeenCalled();
  expect(mockInvoke).not.toHaveBeenCalled();
  expect(result.current.busy).toBe(false);
});

it.each([
  { data: null, error: new Error('provider failed') },
  { data: { text: '' }, error: null },
  { data: { text: 42 }, error: null },
])('reports failed/invalid transcriptions and allows another recording: %p', async (response) => {
  mockInvoke.mockResolvedValue(response);
  const { result, onError, onTranscript } = setup();
  await act(async () => { await result.current.start(); await result.current.stop(); });
  expect(onError).toHaveBeenCalledWith('transcription');
  expect(onTranscript).not.toHaveBeenCalled();
  expect(result.current.busy).toBe(false);
  await act(async () => { await result.current.start(); });
  expect(result.current.recording).toBe(true);
});

it('does not fetch or transcribe when stop produces no URI', async () => {
  mockRecorder.uri = null;
  const { result, onError } = setup();
  await act(async () => { await result.current.start(); await result.current.stop(); });
  expect(mockFetch).not.toHaveBeenCalled();
  expect(onError).toHaveBeenCalledWith('transcription');
});

it('cancels pending permission without starting a recorder or displaying an error', async () => {
  const permission = deferred<{ granted: boolean }>();
  mockPermission.mockReturnValue(permission.promise);
  const { result, onError } = setup();
  let start!: Promise<void>;
  act(() => { start = result.current.start(); result.current.cancel(); });
  await act(async () => { permission.resolve({ granted: true }); await start; });
  expect(mockSetMode).not.toHaveBeenCalled();
  expect(mockRecorder.record).not.toHaveBeenCalled();
  expect(onError).not.toHaveBeenCalled();
  expect(result.current.busy).toBe(false);
});

it('discards a late prepare result after cancellation without starting or uploading it', async () => {
  const prepared = deferred<void>();
  mockRecorder.prepareToRecordAsync.mockReturnValue(prepared.promise);
  const { result, onError } = setup();
  let start!: Promise<void>;
  await act(async () => { start = result.current.start(); });
  act(() => { result.current.cancel(); });
  await act(async () => { prepared.resolve(); await start; });
  expect(mockRecorder.record).not.toHaveBeenCalled();
  expect(mockRecorder.stop).toHaveBeenCalledTimes(1);
  expect(mockSetMode).toHaveBeenLastCalledWith({ allowsRecording: false });
  expect(mockInvoke).not.toHaveBeenCalled();
  expect(onError).not.toHaveBeenCalled();
});

it('begins stopping on unmount before SDK release, without transcribing', async () => {
  const { result, unmount, onTranscript } = setup();
  await act(async () => { await result.current.start(); });
  await act(async () => { unmount(); });
  expect(mockRecorder.stop).toHaveBeenCalledTimes(1);
  expect(mockRecorder.stop.mock.invocationCallOrder[0])
    .toBeLessThan(mockRecorder.release.mock.invocationCallOrder[0]);
  expect(mockSetMode).toHaveBeenLastCalledWith({ allowsRecording: false });
  expect(mockInvoke).not.toHaveBeenCalled();
  expect(onTranscript).not.toHaveBeenCalled();
});

it('ignores a late permission result after unmount', async () => {
  const permission = deferred<{ granted: boolean }>();
  mockPermission.mockReturnValue(permission.promise);
  const { result, unmount, onError } = setup();
  let start!: Promise<void>;
  act(() => { start = result.current.start(); });
  unmount();
  await act(async () => { permission.resolve({ granted: true }); await start; });
  expect(mockRecorder.record).not.toHaveBeenCalled();
  expect(mockSetMode).not.toHaveBeenCalled();
  expect(onError).not.toHaveBeenCalled();
});

it('aborts in-flight transcription and ignores its late response after unmount', async () => {
  const transcription = deferred<{ data: { text: string }; error: null }>();
  mockInvoke.mockReturnValue(transcription.promise);
  const { result, unmount, onTranscript, onError } = setup();
  await act(async () => { await result.current.start(); });
  let stop!: Promise<void>;
  await act(async () => { stop = result.current.stop(); });
  const signal = mockInvoke.mock.calls[0][1].signal as AbortSignal;
  expect(signal.aborted).toBe(false);
  unmount();
  expect(signal.aborted).toBe(true);
  await act(async () => {
    transcription.resolve({ data: { text: 'late result' }, error: null });
    await stop;
  });
  expect(mockRecorder.stop).toHaveBeenCalledTimes(1);
  expect(onTranscript).not.toHaveBeenCalled();
  expect(onError).not.toHaveBeenCalled();
});

it('cancellation while fetching prevents transcription and preserves newer input', async () => {
  const response = deferred<{ blob: () => Promise<{ type: string }> }>();
  mockFetch.mockReturnValue(response.promise);
  const { result, onTranscript, onError } = setup();
  await act(async () => { await result.current.start(); });
  let stop!: Promise<void>;
  await act(async () => { stop = result.current.stop(); });
  act(() => { result.current.cancel(); });
  await act(async () => {
    response.resolve({ blob: async () => ({ type: 'audio/m4a' }) });
    await stop;
  });
  expect(mockFetch.mock.calls[0][1].signal.aborted).toBe(true);
  expect(mockInvoke).not.toHaveBeenCalled();
  expect(onTranscript).not.toHaveBeenCalled();
  expect(onError).not.toHaveBeenCalled();
});


it('keeps failed cleanup owned and permits Stop retry instead of a second recorder', async () => {
  mockRecorder.stop.mockRejectedValueOnce(new Error('stop failed'))
    .mockRejectedValueOnce(new Error('cleanup failed'));
  const { result, onError } = setup();
  await act(async () => { await result.current.start(); await result.current.stop(); });
  expect(onError).toHaveBeenCalledWith('transcription');
  expect(result.current.recording).toBe(true);
  await act(async () => { await result.current.start(); });
  expect(mockPermission).toHaveBeenCalledTimes(1);
  await act(async () => { await result.current.stop(); });
  expect(mockRecorder.stop).toHaveBeenCalledTimes(3);
  expect(result.current).toMatchObject({ recording: false, busy: false });
});

it('cleans up an audio-mode failure and permits retry', async () => {
  mockSetMode.mockRejectedValueOnce(new Error('mode failed'));
  const { result, onError } = setup();
  await act(async () => { await result.current.start(); });
  expect(mockSetMode).toHaveBeenLastCalledWith({ allowsRecording: false });
  expect(mockRecorder.prepareToRecordAsync).not.toHaveBeenCalled();
  expect(onError).toHaveBeenCalledWith('start');
  expect(result.current.busy).toBe(false);
});

it('reports SDK recording error events and discards the recording', async () => {
  const { result, onError, onTranscript } = setup();
  await act(async () => { await result.current.start(); });
  await act(async () => { mockRecordingListener?.({ hasError: true }); });
  expect(mockRecorder.stop).toHaveBeenCalledTimes(1);
  expect(onError).toHaveBeenCalledWith('transcription');
  expect(mockInvoke).not.toHaveBeenCalled();
  expect(onTranscript).not.toHaveBeenCalled();
  expect(result.current.recording).toBe(false);
});

it('surfaces file-read failures without invoking the provider', async () => {
  global.FileReader = class {
    onerror?: () => void;
    readAsDataURL() { this.onerror?.(); }
  } as unknown as typeof FileReader;
  const { result, onError } = setup();
  await act(async () => { await result.current.start(); await result.current.stop(); });
  expect(onError).toHaveBeenCalledWith('transcription');
  expect(mockInvoke).not.toHaveBeenCalled();
});


it('fails closed on repeated web Start, Stop, and Cancel without acquiring a microphone', async () => {
  Object.defineProperty(Platform, 'OS', { configurable: true, value: 'web' });
  const { result, onError, onTranscript } = setup();
  await act(async () => {
    await Promise.all([result.current.start(), result.current.start()]);
    await result.current.stop();
    result.current.cancel();
    await result.current.start();
  });
  expect(result.current).toMatchObject({ blocked: true, busy: false, recording: false });
  expect(onError).toHaveBeenCalledWith('unavailable');
  expect(onTranscript).not.toHaveBeenCalled();
  expectNoWebRecordingAcquisition();
});

it('keeps web unavailable after remount without permission, preparation, recording, or upload', async () => {
  Object.defineProperty(Platform, 'OS', { configurable: true, value: 'web' });
  const first = setup();
  await act(async () => { await first.result.current.start(); });
  first.unmount();
  const remounted = setup();
  expect(remounted.result.current).toMatchObject({ blocked: true, busy: false, recording: false });
  await act(async () => { await remounted.result.current.start(); });
  expect(remounted.onError).toHaveBeenCalledWith('unavailable');
  expectNoWebRecordingAcquisition();
});
