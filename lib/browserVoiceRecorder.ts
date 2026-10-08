/** Browser-only session ownership. This module never acquires media on import. */
const MIME_TYPES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'];
const STOP_TIMEOUT_MS = 5000;

export const WEB_VOICE_UNAVAILABLE_MESSAGE =
  'Voice input needs a secure connection and a browser that supports audio recording. You can type instead.';

export interface BrowserRecordingEnvironment {
  secure: boolean;
  getUserMedia: ((constraints: MediaStreamConstraints) => Promise<MediaStream>) | null;
  Recorder: typeof MediaRecorder | null;
}

export function browserRecordingEnvironment(): BrowserRecordingEnvironment {
  return {
    secure: typeof isSecureContext !== 'undefined' && isSecureContext,
    getUserMedia: typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia
      ? navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices) : null,
    Recorder: typeof MediaRecorder !== 'undefined' ? MediaRecorder : null,
  };
}

export function browserRecordingMimeType(env = browserRecordingEnvironment()): string | null {
  if (!env.secure || !env.getUserMedia || !env.Recorder?.isTypeSupported) return null;
  try { return MIME_TYPES.find((mime) => env.Recorder!.isTypeSupported(mime)) ?? null; }
  catch { return null; }
}

function supportedAudioMime(mime: string): boolean {
  return ['audio/webm', 'audio/mp4'].includes(mime.split(';')[0].trim().toLowerCase());
}

export type BrowserVoiceRecorder = ReturnType<typeof createBrowserVoiceRecorder>;

/**
 * A single-use recorder. Own the stream as soon as getUserMedia resolves, even if
 * cancellation won the race. No object URLs are created: consumers receive a Blob.
 */
export function createBrowserVoiceRecorder(
  onUnexpectedFailure: () => void,
  env = browserRecordingEnvironment(),
) {
  let stream: MediaStream | null = null;
  let recorder: MediaRecorder | null = null;
  let cancelled = false;
  let starting = false;
  let stopping = false;
  let settled = false;
  let chunks: Blob[] = [];
  let timer: ReturnType<typeof setTimeout> | undefined;
  let resolve!: (blob: Blob) => void;
  let reject!: (error: Error) => void;
  const result = new Promise<Blob>((res, rej) => { resolve = res; reject = rej; });
  // Failures can happen while recording, before a consumer calls stop().
  void result.catch(() => {});

  const releaseTracks = () => {
    const owned = stream;
    stream = null;
    // Attempt all tracks, including unexpected non-audio tracks, exactly once.
    for (const track of owned?.getTracks() ?? []) {
      try { track.stop(); } catch { /* The standard stop() method does not throw. */ }
    }
  };
  const detach = () => {
    if (timer !== undefined) clearTimeout(timer);
    if (recorder) {
      recorder.ondataavailable = null;
      recorder.onstop = null;
      recorder.onerror = null;
    }
    chunks = [];
  };
  const fail = (error: Error, unexpected = false) => {
    if (settled) return;
    settled = true;
    // Stop capture synchronously, even when MediaRecorder.stop() itself fails.
    releaseTracks();
    detach();
    try { if (recorder && recorder.state !== 'inactive') recorder.stop(); } catch { /* Tracks are already stopped. */ }
    reject(error);
    if (unexpected && !cancelled) onUnexpectedFailure();
  };
  const cancel = () => {
    cancelled = true;
    fail(new Error('Recording cancelled'));
    // A late acquisition still owns and releases its tracks inside start().
  };

  return {
    cancel,
    async start() {
      if (starting || cancelled || settled) throw new Error('Recording session already used');
      starting = true;
      const mimeType = browserRecordingMimeType(env);
      if (!mimeType) { fail(new Error('Recording unavailable')); throw new Error('Recording unavailable'); }
      try {
        stream = await env.getUserMedia!({ audio: true });
        if (cancelled || settled) {
          releaseTracks();
          throw new Error('Recording cancelled');
        }
        recorder = new env.Recorder!(stream, { mimeType });
        recorder.ondataavailable = (event) => {
          if (!settled && !cancelled && event.data.size > 0) chunks.push(event.data);
        };
        recorder.onerror = () => fail(new Error('Recording failed'), !stopping);
        recorder.onstop = () => {
          if (settled) return;
          if (!stopping) { fail(new Error('Recording interrupted'), true); return; }
          // The final dataavailable precedes stop. Preserve the browser's actual
          // type, rather than labelling every recording with a requested codec.
          const actualMime = chunks.find((chunk) => chunk.type)?.type || recorder!.mimeType;
          if (!supportedAudioMime(actualMime)) { fail(new Error('Unsupported recorded audio')); return; }
          const blob = new Blob(chunks, { type: actualMime });
          if (!blob.size) { fail(new Error('Empty recording')); return; }
          settled = true;
          releaseTracks();
          detach();
          resolve(blob);
        };
        recorder.start();
        if (settled || cancelled) throw new Error('Recording interrupted');
      } catch (error) {
        releaseTracks();
        fail(error instanceof Error ? error : new Error('Could not start recording'));
        throw error;
      }
    },
    stop(): Promise<Blob> {
      if (stopping || settled) return result;
      if (!recorder || recorder.state !== 'recording') {
        fail(new Error('No active recording'));
        return result;
      }
      stopping = true;
      timer = setTimeout(() => fail(new Error('Recording did not finish')), STOP_TIMEOUT_MS);
      try { recorder.stop(); }
      catch { fail(new Error('Could not stop recording')); }
      finally { releaseTracks(); }
      return result;
    },
  };
}
