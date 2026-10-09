# Browser voice recording: scoped restoration

The web platform module (`lib/useVoiceRecording.web.ts`) uses an explicit
MediaRecorder adapter. Metro selects it for browser bundles; native platforms
retain `lib/useVoiceRecording.ts` and Expo Audio unchanged. This work does **not**
fix or bypass the existing web biometric startup lock. A static export is still
not a usable, authenticated web demo.

## Recording and cancellation

- Mounting, capability detection and rendering never request microphone access.
  Only Start requests `getUserMedia({ audio: true })` through the normal browser
  permission flow. HTTPS (or another browser-trusted secure context),
  MediaRecorder and a supported WebM/MP4 audio encoder are required.
- Each adapter owns its acquired MediaStream directly. It stops every track on
  Stop, Cancel, constructor/start/stop errors, unexpected recorder termination,
  unmount, page hide and browser-tab hiding. Stop releases tracks synchronously,
  before waiting for the final data/stop event or uploading anything.
- getUserMedia cannot abort a pending permission prompt. Cancellation marks the
  session invalid and keeps its Start lock until the promise settles. If permission
  later resolves, every returned track is stopped before recorder construction.
  The user may need to dismiss the browser prompt before starting again.
- A five-second final-event timeout prevents a broken recorder from leaving Stop
  pending indefinitely; its tracks have already stopped. Handlers, chunks and
  timers are discarded after completion/cancellation.
- Audio stays as a Blob in memory. No blob URL is created, fetched or retained,
  so no URL revocation lifecycle is needed. There is no local audio persistence.
- Cancel aborts file-reading/transcription and ignores late results even when a
  provider/mock ignores the abort signal. A new session cannot receive an older
  session's transcript. Cancelling cannot recall a request already sent.
- Both consumers offer Cancel while recording/processing. Focus loss cancels;
  typing or clearing a newer search cancels before updating the input. Unsupported
  environments and voice-button errors remain visible without native Alert APIs.

The browser prompt, app permissions and security settings are never automatically
accepted or changed by this implementation.

## Upload contract

The client sends the actual recorded Blob MIME, including codec parameters, to
the existing `transcribe-audio` function. Its pure `transcriptionFormat.ts` helper
validates the MIME/body/base64, then creates multipart audio with matching names:

- `audio/webm` → `audio.webm`
- `audio/mp4` → `audio.mp4`
- `audio/m4a` → `audio.m4a`

Valid MIME parameters are retained. An omitted MIME keeps the native M4A default.
Unknown/malformed input is rejected before the upstream request. This validates
metadata and encoding, not whether bytes are real decodable audio. The function
still uses its existing provider/model and authentication configuration. No
credentials, deployment, RLS, CORS, auth or biometric policy changes are included.
The frontend and function changes must eventually be released together through a
separately authorized deployment. This draft does not claim a live server upgrade.

## Reproduce deterministic checks

```sh
npm run test:voice
npm run test:unit
npm run typecheck
npm test
```

The Node suite uses fake tracks/recorders and synthetic bytes; the Jest web suite
runs the production hook with those browser boundaries faked. Tests cover denied
permission, unsupported contexts/codecs, pending cancellation, duplicate Start and
Stop, constructor/start/stop errors, unexpected errors/stops, delayed final events,
empty/unsupported output, timeouts, cancellation at each processing stage,
unmount, pagehide/visibility loss and MIME/filename multipart output. UI tests
exercise Start, Stop, Cancel, focus cleanup and newer typed/cleared search.
Native and offline baseline suites remain in the aggregate command unchanged.
`typecheck:voice` checks the pure multipart helper; it does not validate the Deno
entrypoint/runtime or deployed function.

## Verification limits

The isolated cloud Chromium fixture could not launch: the executor denied its
required socket operation. No browser screenshot or actual browser codec/runtime
success is claimed. Tests did not access a real microphone, accept a permission
prompt, use user audio, call providers or exercise a native device/build. Real
browser permission/codec support, native MIME aliases/device release, provider
acceptance and authenticated end-to-end flow remain unvalidated. The existing
web startup-lock issue and dependency security findings remain open.

The existing EAS build failure occurred after dependency installation because
Expo authentication was absent. It is not evidence of a dependency failure; no
credentials were configured or EAS build requested for this restoration.

References: [MediaStream Recording specification](https://www.w3.org/TR/mediastream-recording/),
[Media Capture and Streams](https://www.w3.org/TR/mediacapture-streams/),
[OpenAI file transcription formats](https://developers.openai.com/api/docs/guides/speech-to-text).
