# Expo SDK 55 runtime baseline

## Why these versions

This completes the repository's existing SDK 55 migration rather than upgrading
SDK majors independently. Expo's [SDK 55 reference](https://docs.expo.dev/versions/v55.0.0/)
specifies React 19.2 / React Native 0.83. Exact module versions follow the published
[Expo 55.0.31 bundled map](https://github.com/expo/expo/blob/sdk-55/packages/expo/bundledNativeModules.json),
verified against the installed package. Keep NativeWind 4 and Tailwind 3 together.
The final patches are recorded in `package-lock.json`.

Unrelated locked Supabase 2.98.0, i18next 23.16.8 / react-i18next 15.7.4,
NativeWind 4.2.2, Tailwind 3.4.19, PostHog 3.16.1, RevenueCat 8.12.0, Zustand 5.0.11
and Babel 7.29.0 are retained. Separate Dependabot PRs must be rebased on this
matrix and tested; their older manifest/lock patches should not be stacked blindly.

Companion repairs:

- Declared the imported `expo-location`, Router's `expo-linking` peer, the audio
  `expo-asset` peer, `react-native-worklets`, Babel preset and development client.
- Migrated both `expo-av` voice recording consumers to `expo-audio`; SDK 55 removed
  `expo-av`. Shared recording lifecycle tests mock device and provider calls.
- Imported config plugins through `expo/config-plugins`; removed the incompatible
  standalone v9 package. Removed obsolete `jsEngine` config (SDK 55 uses Hermes).
- Kept the existing Inter font aliases/weights using `@expo-google-fonts/inter`
  packaged font files (MIT/OFL), replacing references to absent local files.
  Reused the existing icon for the missing favicon reference.
- Restored Jest 29/jest-expo 55 and the matching React 19.2 test renderer, fixed Jest
  setup/discovery, and used the installed Reanimated/Worklets test mocks.
- Repaired real failures uncovered by checks: RevenueCat listener removal, a
  missing EmptyState button role, analytics JSON property types and an API mock
  signature. Existing assertions were preserved.
- Followed [Supabase's platform-specific storage selection](https://supabase.com/docs/guides/auth/quickstarts/react-native)
  to avoid AsyncStorage's `window` access during static export. Native storage,
  persistence, refresh and URL-session settings are unchanged; on web the SDK
  uses localStorage when available. No database/policy/auth-provider changes.

## Reproduction and coverage

Use Node 24.19.0 / npm 11.9.0 (`.nvmrc` and `packageManager`). Run `npm ci`,
`npm ls --all`, `npm run typecheck`, `npm test`, `npx expo install --check`,
`npx expo-doctor@1.20.4`, and the README web export command. The runtime workflow
runs install/tree/typecheck/tests/export on pull requests without provider secrets.
The standalone offline workflow remains usable without installing app packages.

- `test:offline`: storage and queue behavior in a single JS runtime, using fakes.
- `test:unit`: existing auth/API/EmptyState assertions plus audio lifecycle,
  subscription cleanup and platform-storage configuration regressions.
- `typecheck`: strict app and Jest TypeScript. Deno Edge Functions are a separate
  compiler/runtime; excluding them does not certify their types or deployment.
- `export:web`: Metro browser and server bundles plus static routes. Worker count
  is capped to avoid memory pressure. Placeholder values do not call a live backend.
- Sentry 7.11 API options used here remain accepted by its installed types. Its
  [5→6](https://docs.sentry.io/platforms/react-native/migration/v5-to-v6/) and
  [6→7](https://docs.sentry.io/platforms/react-native/migration/v6-to-v7/) migrations
  were reviewed. No Sentry ingestion, native symbol upload or profiling was tested.

## Remaining validation boundaries

No Android/iOS project was compiled, no simulator/device or microphone permission
flow was exercised, and no EAS build, update, merge or deployment was requested.
Expo Go is not proof that the custom WidgetKit target, RevenueCat, biometric
storage, push configuration or other native modules work in a standalone build.
Native preview builds still need correct project/configuration, credentials and
an authorized build workflow. The existing EAS workflow still triggers on main;
review that before any future merge. This PR does not trigger a paid EAS build.

A real sandbox must validate auth and session persistence, database/RLS behavior,
recording/transcription, camera/location, offline reconnect, notification/deep-link
routing, subscription events and purchases. The app still has pre-existing product
and backend limitations; passing this baseline does not assert otherwise.

The transcription Edge Function still names its upstream audio file `audio.m4a`
regardless of MIME. The native client preserves recorded Blob MIME. Any future browser adapter also
needs a separately tested server filename/MIME fix before live WebM transcription.

Install-time deprecation warnings remain in transitive tooling (including Jest 29
and older glob/rimraf packages). Passing resolution/Doctor is not a security audit.
Sentry's config plugin warns when its organization/project are unset; that is
expected for provider-free checks and not evidence that native source-map upload works.

### Browser voice is intentionally unavailable

The SDK 55 web recorder cannot guarantee release of a stream acquired during a
preparation that is cancelled or rejects before recording starts. This draft
therefore **does not offer web recording**: an availability guard returns before
any microphone permission, preparation, or recording operation. Both consumers
show visible unavailable messaging. Repeated-start and remount tests assert that
no recording operation is called. Native recording retains its migrated lifecycle.

Browser voice remains an incomplete feature until a separately tested adapter can
own and release its MediaStream reliably. See the [recording validation notes](../__tests__/lib/voice-recording-validation.md).
Mocked native tests are not proof of operating-system microphone release. Do not
present the export as a validated recording demo.

### Existing interactive-web startup blocker

Source inspection also found that `RootLayout.checkBiometric()` calls
`isBiometricEnabled()`, which reads Expo SecureStore without a web availability
guard. SDK 55's web SecureStore module has no `getValueWithKeyAsync`, so that
promise rejects; the initial `biometricLocked` state can remain true. This PR does
not change biometric/security behavior. A separately reviewed platform-aware auth
startup fix and browser test are needed before advertising a usable web demo.

A headless Chromium smoke test was attempted in the cloud executor but could not
launch because the runtime denies its required socket operation. No browser
interaction or screenshot is claimed from that attempt.

See the [separate web platform/security proposal](web-platform-proposal.md) for
a bounded next step. It is design guidance only; none of those changes is applied.

### Dependency security review is still open

The first runtime CI installation on 8 October 2026 reported **68 npm dependency
vulnerability findings: 1 critical, 52 high, 14 moderate, 1 low**. That summary
includes the installed development/runtime tree; it is not a count of proven
exploitable app vulnerabilities. Detailed advisory retrieval in this executor was
blocked by its network allowlist, so production reachability and individual fixes
have not been triaged. Do not treat green build/Doctor results as security clearance.
Do not apply forced audit upgrades that break the Expo compatibility matrix.

The initial CI run also exposed that Node 24.19.0 bundles npm 11.17.0 on the runner.
Both workflows now explicitly install the documented npm 11.9.0 before `npm ci`;
`packageManager`/`engines` alone do not select the npm executable.
