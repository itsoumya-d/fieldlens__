# FieldLens

AI coaching app for tradespeople. Point your camera at your work, get AI feedback.

## Runtime

- Expo SDK 55 (React 19.2.0 / React Native 0.83.10), Expo Router
- TypeScript, NativeWind 4 / Tailwind CSS 3
- Supabase (Auth, DB, Storage and Edge Functions)
- OpenAI image/audio services via Supabase Edge Functions

## Setup

1. Use Node **24.19.0** (`nvm install && nvm use`) and npm **11.9.0**
   (`npm install --global npm@11.9.0`; the Node distribution may bundle a newer npm).
2. Run `npm ci`. The committed lockfile is the reproducible baseline; do not use
   `--force` or `--legacy-peer-deps` to bypass dependency conflicts.
3. Copy `.env.example` to `.env`. Set a sandbox Supabase URL and public anon key.
   Never place service-role keys or server provider secrets in `EXPO_PUBLIC_*`.
   Optional analytics, monitoring, RevenueCat and push keys can remain unset.
4. Run `npm run web` for web development, or `npm start` for native development.
   Native capabilities need a compatible device/development build and permissions.

## Checks

```sh
npm run typecheck
npm test
npx expo install --check
npx expo-doctor@1.20.4
npm run export:web -- --max-workers 2
```

`npm test` runs both the provider-free Node offline queue suite and Jest's
mocked component/library tests. TypeScript checks app and test source, while
Supabase Edge Functions use a separate Deno runtime and are not covered by this
app compiler. No lint configuration currently exists.

For a **build-only check without a backend**, use the non-routable placeholders:

```sh
EXPO_PUBLIC_SUPABASE_URL=https://fieldlens-ci.invalid \
EXPO_PUBLIC_SUPABASE_ANON_KEY=fieldlens-ci-placeholder \
npm run export:web -- --max-workers 2
```

These values only allow bundling/static rendering. They do not make auth,
database queries, AI, uploads or purchases work. An export is not a device test
or a production-ready demo. Web voice input is intentionally unavailable until its
stream cleanup can be guaranteed; native recording still needs device validation. See [runtime verification](docs/runtime-baseline.md)
for coverage and remaining limits.

## Documentation

- [Offline queue semantics and regression coverage](tests/README.md)
- [Runtime migration and verification](docs/runtime-baseline.md)
- `saas-docs/` contains product documentation; older version/build claims there
  are not evidence that those flows have been validated against this baseline.
