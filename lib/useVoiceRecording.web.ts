import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  browserRecordingMimeType,
  createBrowserVoiceRecorder,
  type BrowserVoiceRecorder,
} from './browserVoiceRecorder';
export { WEB_VOICE_UNAVAILABLE_MESSAGE } from './browserVoiceRecorder';

export type VoiceRecordingError = 'permission' | 'start' | 'transcription' | 'unavailable';
type Phase = 'idle' | 'starting' | 'recording' | 'processing' | 'unavailable';
type Options = {
  onTranscript: (text: string) => void;
  onError: (error: VoiceRecordingError) => void;
};
type Session = { recorder: BrowserVoiceRecorder; abort: AbortController; cancelled: boolean };

function readBase64(blob: Blob, signal: AbortSignal): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const detach = () => signal.removeEventListener('abort', abort);
    const abort = () => { reader.abort(); detach(); reject(new Error('Recording cancelled')); };
    reader.onload = () => {
      detach();
      const result = reader.result;
      if (typeof result !== 'string' || !result.includes(',') || result.endsWith(',')) {
        reject(new Error('Could not read recording'));
      } else resolve(result.slice(result.indexOf(',') + 1));
    };
    reader.onerror = () => { detach(); reject(new Error('Could not read recording')); };
    reader.onabort = () => { detach(); reject(new Error('Recording cancelled')); };
    if (signal.aborted) { reject(new Error('Recording cancelled')); return; }
    signal.addEventListener('abort', abort, { once: true });
    try { reader.readAsDataURL(blob); }
    catch (error) { detach(); reject(error); }
  });
}

/** Metro selects this on web; the native expo-audio hook stays unchanged. */
export function useVoiceRecording({ onTranscript, onError }: Options) {
  // Keep server/client first renders identical; capability detection never asks
  // permission. Only an explicit Start reaches getUserMedia.
  const [phase, setPhase] = useState<Phase>('unavailable');
  const phaseRef = useRef<Phase>('unavailable');
  const mounted = useRef(true);
  const sessionRef = useRef<Session | null>(null);
  const callbacks = useRef({ onTranscript, onError });
  callbacks.current = { onTranscript, onError };
  const updatePhase = useCallback((next: Phase) => {
    phaseRef.current = next;
    if (mounted.current) setPhase(next);
  }, []);
  const isCurrent = useCallback((session: Session) => (
    mounted.current && !session.cancelled && sessionRef.current === session
  ), []);
  const finish = useCallback((session: Session) => {
    if (sessionRef.current !== session) return;
    sessionRef.current = null;
    updatePhase(browserRecordingMimeType() ? 'idle' : 'unavailable');
  }, [updatePhase]);

  const cancel = useCallback(() => {
    const session = sessionRef.current;
    if (!session) return;
    session.cancelled = true;
    session.abort.abort();
    session.recorder.cancel();
    // getUserMedia has no abort API. Keep its lock until it resolves/rejects so
    // repeated taps cannot create multiple pending prompts/acquisitions. Its late
    // stream will be stopped before any recorder can be constructed.
    if (phaseRef.current !== 'starting') finish(session);
  }, [finish]);

  useEffect(() => {
    mounted.current = true;
    updatePhase(browserRecordingMimeType() ? 'idle' : 'unavailable');
    const onHidden = () => { if (document.visibilityState === 'hidden') cancel(); };
    if (typeof window !== 'undefined') window.addEventListener('pagehide', cancel);
    if (typeof document !== 'undefined') document.addEventListener('visibilitychange', onHidden);
    return () => {
      mounted.current = false;
      cancel();
      if (typeof window !== 'undefined') window.removeEventListener('pagehide', cancel);
      if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', onHidden);
    };
  }, [cancel, updatePhase]);

  const start = useCallback(async () => {
    if (!mounted.current || sessionRef.current) return;
    if (!browserRecordingMimeType()) {
      updatePhase('unavailable');
      callbacks.current.onError('unavailable');
      return;
    }
    const session: Session = {
      cancelled: false,
      abort: new AbortController(),
      recorder: createBrowserVoiceRecorder(() => {
        if (!isCurrent(session)) return;
        callbacks.current.onError('transcription');
        cancel();
      }),
    };
    sessionRef.current = session;
    updatePhase('starting');
    let started = false;
    try {
      await session.recorder.start();
      if (!isCurrent(session)) return;
      started = true;
      updatePhase('recording');
    } catch (error) {
      if (isCurrent(session)) {
        const name = error && typeof error === 'object' && 'name' in error ? error.name : '';
        callbacks.current.onError(name === 'NotAllowedError' || name === 'SecurityError' ? 'permission' : 'start');
      }
    } finally {
      if (!started || session.cancelled) {
        session.recorder.cancel();
        finish(session);
      }
    }
  }, [cancel, finish, isCurrent, updatePhase]);

  const stop = useCallback(async () => {
    const session = sessionRef.current;
    if (!session || !mounted.current) return;
    if (phaseRef.current === 'starting') { cancel(); return; }
    if (phaseRef.current !== 'recording') return;
    updatePhase('processing');
    try {
      const blob = await session.recorder.stop();
      if (!isCurrent(session)) return;
      const audioBase64 = await readBase64(blob, session.abort.signal);
      if (!isCurrent(session)) return;
      const { data, error } = await supabase.functions.invoke('transcribe-audio', {
        body: { audioBase64, mimeType: blob.type },
        signal: session.abort.signal,
      });
      if (!isCurrent(session)) return;
      if (error || typeof data?.text !== 'string' || !data.text.trim()) throw new Error('Transcription failed');
      callbacks.current.onTranscript(data.text);
    } catch {
      if (isCurrent(session)) callbacks.current.onError('transcription');
    } finally {
      session.recorder.cancel();
      finish(session);
    }
  }, [cancel, finish, isCurrent, updatePhase]);

  return {
    recording: phase === 'recording',
    busy: phase === 'starting' || phase === 'processing',
    blocked: phase === 'unavailable',
    start, stop, cancel,
  };
}
