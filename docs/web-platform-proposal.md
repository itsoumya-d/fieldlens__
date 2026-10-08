# Web platform follow-on proposal (not implemented)

The runtime baseline can export browser bundles. It does not establish a usable
browser app. Keep the dependency PR in draft while the following decisions and
checks remain unresolved.

## Account authentication and local biometric lock

Native account authentication and the optional device-local biometric lock are
separate protections. Do not fix the web startup failure by returning false from
all biometric checks, swallowing security errors, or declaring a failed unlock a
success. Native SecureStore and lock behavior must remain intact.

A follow-on should first specify the web product boundary explicitly:

1. Offer an account-authenticated browser experience only after a reviewed web
   session/onboarding flow is defined and tested. A missing native API must produce
   an explicit supported/unsupported state, not an unhandled promise or a silent
   unlock. A lock failure on a supported native device must remain fail-closed and
   give the user a recovery action.
2. Show native-only device-biometric settings as unavailable on web. Do not copy
   biometric flags, secrets or device-local storage to ordinary browser storage.
   Do not claim WebAuthn/passkey protection unless separately designed and
   authorized; it is not a drop-in substitute for the current local app lock.
3. Define exactly which routes require an authenticated account and which are
   public onboarding/login screens. Exercise initial launch, existing/expired
   sessions, reload, deep links, logout, cancel and failed storage/authentication.
   UI routing is not authorization: server policies must still protect user data.

This proposal changes no account, permission, biometric, storage-security or
server-policy setting.

## Browser microphone ownership

SDK 55 expo-audio has no public release mechanism for a stream acquired during a
preparation that is subsequently cancelled or rejects before recording starts.
Suppressing late transcripts and preventing another Start do not release that
stream. The dependency draft fails closed before any web microphone permission or
acquisition; both voice controls explain that browser voice is unavailable. Native
recording remains available. Restoring browser voice is a separate incomplete feature.

A bounded follow-on option is an explicit browser recording adapter using standard
MediaRecorder/getUserMedia APIs while retaining expo-audio on native. It must own
the MediaStream directly, stop every track in all cancellation/failure paths, and
never begin a cancelled recording just to make Stop legal. The adapter must reject
unsupported MIME/recording environments with a useful message and pass the actual
MIME/extension consistently through the server upload contract.

Required deterministic tests use fake streams/recorders, never a real microphone:
permission denial; cancellation before/after permission resolution; acquisition
followed by preparation failure; rapid Start/Stop; constructor/start/stop errors;
unmount/navigation; concurrent cleanup; stopped-track counts; blob URL revocation;
late transcription suppression and repeated sessions. Browser tests with synthetic
media can validate integration; real-device and live-provider validation stays a
separate explicit step. No microphone/user data or live credentials are needed to
implement these regressions.
