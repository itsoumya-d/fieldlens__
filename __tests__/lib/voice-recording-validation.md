# Voice recording migration validation

Run `npm run test:unit -- --runInBand __tests__/lib/useVoiceRecording.test.ts`.

This is a mocked lifecycle/consumer-contract suite. It does not access a microphone,
call Supabase/OpenAI, prove speech recognition quality, or validate native builds.
Native coverage includes permission denial, prepare/record/stop ordering, URI and
MIME payloads, rapid taps, failure recovery, cancellation, SDK recording errors,
unmount ordering, and suppression/aborting of late transcription results. The
library consumer also cancels on blur and when the user types a newer search.

## Web recording adapter

The browser now resolves `useVoiceRecording.web.ts`, separate from the unchanged
native Expo Audio hook. The former web-unavailable tests in the native hook suite
remain as fallback guards; they do not describe Metro's selected web module.
Run `npm run test:voice` and the `useVoiceRecording.web.test.ts` Jest suite for the
actual browser adapter's fake-stream/session/upload coverage. See
[scope, lifecycle guarantees and limits](../../docs/web-voice-recording.md).

No real microphone or user audio is used. The attempted synthetic Chromium
fixture could not launch because the executor denies required socket operations.
No browser interaction or actual codec success is claimed.

## Native checks still required

- On iOS and Android, deny permission, grant it, record and transcribe twice, stop
  immediately, navigate away during preparation/recording, and verify the operating
  system microphone indicator turns off.
- Exercise interruption, recording-error, stop-error and audio-session reset paths
  on real devices; the tests model those errors, not the operating system.
- Native HIGH_QUALITY produces M4A. The frontend preserves a Blob audio MIME when
  provided, with an M4A fallback. The edge-function helper now maps WebM/MP4/M4A MIME types to matching filenames;
  native runtime MIME aliases and live transcription remain unvalidated.

API reference: https://docs.expo.dev/versions/v55.0.0/sdk/audio/
