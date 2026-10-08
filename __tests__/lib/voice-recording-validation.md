# Voice recording migration validation

Run `npm run test:unit -- --runInBand __tests__/lib/useVoiceRecording.test.ts`.

This is a mocked lifecycle/consumer-contract suite. It does not access a microphone,
call Supabase/OpenAI, prove speech recognition quality, or validate native builds.
Native coverage includes permission denial, prepare/record/stop ordering, URI and
MIME payloads, rapid taps, failure recovery, cancellation, SDK recording errors,
unmount ordering, and suppression/aborting of late transcription results. The
library consumer also cancels on blur and when the user types a newer search.

## Web voice input is unavailable

All web voice recording fails closed before requesting permission, preparing, or
starting a recorder. The SDK hook constructor creates only an inactive object; it
does not call `getUserMedia()`. A direct, repeated, or remounted Start call cannot
reach permission, preparation, recording, fetching audio, or transcription.
Both the reusable voice button and library show persistent visible text:
“Voice input is unavailable on the web. Use the native app for voice input.”
Reloading does not enable it. Typed library search remains available.

The web guard is intentional until a safe adapter owns the MediaStream and releases
its tracks on every successful, failed, cancelled, and unmounted path. Inspection
of installed `expo-audio` 55.0.18 found these gaps:

- `prepareToRecordAsync()` acquires a stream before recording. Cancelling a late
  preparation can leave an inactive MediaRecorder whose `stop()` rejects.
- Preparation can acquire a stream and then reject during `enumerateDevices()` or
  MediaRecorder construction, before the SDK stores a usable recorder.
- The web recorder has no public prepared-stream cancellation method and no
  `release()` override that reliably stops these partially acquired streams.

No private SDK fields, deliberate post-cancel recording, auth/biometric bypasses,
or stream-acquiring workarounds are used. The deterministic web tests assert the
availability state and zero permission, mode, preparation, record, stop, fetch, or
provider calls on mount, repeated calls, and remount. They do not claim microphone
or browser runtime validation.

## Native checks still required

- On iOS and Android, deny permission, grant it, record and transcribe twice, stop
  immediately, navigate away during preparation/recording, and verify the operating
  system microphone indicator turns off.
- Exercise interruption, recording-error, stop-error and audio-session reset paths
  on real devices; the tests model those errors, not the operating system.
- Native HIGH_QUALITY produces M4A. The frontend preserves a Blob audio MIME when
  provided, with an M4A fallback. The existing edge function still names its upstream
  upload `audio.m4a`; no live provider or future web transcription is validated.

API reference: https://docs.expo.dev/versions/v55.0.0/sdk/audio/
