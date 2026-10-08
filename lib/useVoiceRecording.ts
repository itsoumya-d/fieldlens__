import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
} from 'expo-audio';
import { supabase } from '@/lib/supabase';

export type VoiceRecordingError = 'permission' | 'start' | 'transcription' | 'unavailable';
export const WEB_VOICE_UNAVAILABLE_MESSAGE =
  'Voice input is unavailable on the web. Use the native app for voice input.';
type Phase = 'idle' | 'starting' | 'recording' | 'processing' | 'unavailable';

type Session = {
  cancelled: boolean;
  prepared: boolean;
  modeEnabled: boolean;
  abort: AbortController;
  cleanup?: Promise<string | null>;
  uri?: string | null;
};

type Options = {
  onTranscript: (text: string) => void;
  onError: (error: VoiceRecordingError) => void;
};

function readBase64(blob: Blob, signal: AbortSignal): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const abort = () => {
      reader.abort();
      reject(new Error('Recording cancelled'));
    };
    const detach = () => signal.removeEventListener('abort', abort);
    reader.onload = () => {
      detach();
      const result = reader.result;
      if (typeof result !== 'string' || !result.includes(',') || result.endsWith(',')) {
        reject(new Error('Could not read recording'));
      } else {
        resolve(result.slice(result.indexOf(',') + 1));
      }
    };
    reader.onerror = () => { detach(); reject(new Error('Could not read recording')); };
    reader.onabort = () => { detach(); reject(new Error('Recording cancelled')); };
    if (signal.aborted) { reject(new Error('Recording cancelled')); return; }
    signal.addEventListener('abort', abort, { once: true });
    reader.readAsDataURL(blob);
  });
}

/** Shared SDK 55 recorder lifecycle for voice input and library search. */
export function useVoiceRecording({ onTranscript, onError }: Options) {
  const initialPhase: Phase = Platform.OS === 'web' ? 'unavailable' : 'idle';
  const [phase, setPhase] = useState<Phase>(initialPhase);
  const phaseRef = useRef<Phase>(initialPhase);
  const mounted = useRef(true);
  const sessionRef = useRef<Session | null>(null);
  const callbacks = useRef({ onTranscript, onError });
  callbacks.current = { onTranscript, onError };
  const cancelRef = useRef<() => void>(() => {});

  // Register before the SDK hook so cancellation starts before its native release.
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; cancelRef.current(); };
  }, []);
  // SDK 55 construction does not request permission or acquire a MediaStream.
  // Web is guarded below before either permission requests or preparation.
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY, (status) => {
    // Android may emit a recording error instead of rejecting stop().
    const session = sessionRef.current;
    if (status.hasError && session && !session.cancelled && mounted.current) {
      callbacks.current.onError(phaseRef.current === 'starting' ? 'start' : 'transcription');
      cancelRef.current();
    }
  });

  const updatePhase = useCallback((next: Phase) => {
    phaseRef.current = next;
    if (mounted.current) setPhase(next);
  }, []);

  const isCurrent = useCallback((session: Session) => (
    mounted.current && !session.cancelled && sessionRef.current === session
  ), []);

  const stopAndReset = useCallback((session: Session): Promise<string | null> => {
    // Reuse the same stop promise when cancellation races with Stop.
    if (session.cleanup) return session.cleanup;
    session.cleanup = (async () => {
      try {
        if (session.prepared) {
          await recorder.stop();
          session.prepared = false;
          if (mounted.current) session.uri = recorder.uri;
          if (isCurrent(session)) return session.uri ?? null;
        }
        return null;
      } finally {
        if (session.modeEnabled) {
          await setAudioModeAsync({ allowsRecording: false });
          session.modeEnabled = false;
        }
      }
    })().catch((error) => {
      // Preserve ownership on failure so cancellation or another Stop can retry.
      session.cleanup = undefined;
      throw error;
    });
    return session.cleanup;
  }, [recorder, isCurrent]);

  const finish = useCallback((session: Session) => {
    if (sessionRef.current === session) {
      if (mounted.current && (session.prepared || session.modeEnabled)) {
        // Do not offer Start while a failed Stop may still own the microphone.
        updatePhase('recording');
        return;
      }
      sessionRef.current = null;
      updatePhase('idle');
    }
  }, [updatePhase]);

  const start = useCallback(async () => {
    // The ref lock is synchronous; React state alone cannot guard rapid taps.
    if (!mounted.current || sessionRef.current) return;
    // Fail closed until a web adapter can own/release streams on every exit path.
    if (Platform.OS === 'web') {
      callbacks.current.onError('unavailable');
      return;
    }
    const session: Session = {
      cancelled: false, prepared: false, modeEnabled: false, abort: new AbortController(),
    };
    sessionRef.current = session;
    updatePhase('starting');
    let started = false;
    try {
      const { granted } = await requestRecordingPermissionsAsync();
      if (!isCurrent(session)) return;
      if (!granted) { callbacks.current.onError('permission'); return; }
      session.modeEnabled = true;
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      if (!isCurrent(session)) return;
      await recorder.prepareToRecordAsync();
      session.prepared = true;
      if (!isCurrent(session)) return;
      recorder.record();
      started = true;
      updatePhase('recording');
    } catch {
      if (isCurrent(session)) callbacks.current.onError('start');
    } finally {
      if (!started || session.cancelled) {
        try { await stopAndReset(session); } catch { /* The SDK also releases native resources on unmount. */ }
        finish(session);
      }
    }
  }, [recorder, isCurrent, updatePhase, stopAndReset, finish]);

  const stop = useCallback(async () => {
    const session = sessionRef.current;
    if (!session || phaseRef.current !== 'recording' || !mounted.current) return;
    updatePhase('processing');
    try {
      const uri = await stopAndReset(session);
      if (!isCurrent(session)) return;
      if (!uri) throw new Error('No recording URI');
      const response = await fetch(uri, { signal: session.abort.signal });
      const blob = await response.blob();
      if (!isCurrent(session)) return;
      const audioBase64 = await readBase64(blob, session.abort.signal);
      if (!isCurrent(session)) return;
      // Native HIGH_QUALITY produces M4A; preserve a more specific Blob audio MIME.
      const mimeType = blob.type.startsWith('audio/') ? blob.type : 'audio/m4a';
      const { data, error } = await supabase.functions.invoke('transcribe-audio', {
        body: { audioBase64, mimeType },
        signal: session.abort.signal,
      });
      if (!isCurrent(session)) return;
      if (error || typeof data?.text !== 'string' || !data.text.trim()) {
        throw new Error('Could not transcribe audio');
      }
      callbacks.current.onTranscript(data.text);
    } catch {
      if (isCurrent(session)) callbacks.current.onError('transcription');
    } finally {
      if (session.prepared || session.modeEnabled) {
        try { await stopAndReset(session); } catch { /* Keep ownership for another Stop. */ }
      }
      finish(session);
    }
  }, [isCurrent, updatePhase, stopAndReset, finish]);

  const cancel = useCallback(() => {
    const session = sessionRef.current;
    if (!session) return;
    session.cancelled = true;
    session.abort.abort();
    // A pending start owns its cleanup, including a late permission/prepare result.
    if (phaseRef.current === 'starting') return;
    updatePhase('processing');
    void stopAndReset(session).catch(() => {}).finally(() => finish(session));
  }, [stopAndReset, finish, updatePhase]);
  cancelRef.current = cancel;

  return {
    recording: phase === 'recording',
    busy: phase === 'starting' || phase === 'processing',
    blocked: phase === 'unavailable',
    start,
    stop,
    cancel,
  };
}
