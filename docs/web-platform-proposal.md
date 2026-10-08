# Web platform follow-on proposal

The runtime baseline can export browser bundles. It does not establish a usable
browser app. Account/startup decisions below remain unresolved. Browser recording
ownership is now implemented as a separately tested follow-on; see
[restoration scope and validation](web-voice-recording.md).

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

The original dependency baseline disabled browser voice because SDK 55 expo-audio
could not publicly release a stream when preparation was cancelled or rejected
before recording. That historical guard remains in the native fallback module.
The separate `.web.ts` hook now routes browsers to an explicit MediaRecorder
adapter that owns and releases acquired tracks, with a tested WebM/MP4 upload
contract. See [browser voice recording](web-voice-recording.md) for the implemented
scope, fake-only regressions, pending-permission limits and unvalidated behavior.

This recording work does not settle any account/authentication or biometric-lock
policy decision above. Keep those protections intact in future web startup work.
