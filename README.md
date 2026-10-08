# FieldLens

AI coaching app for tradespeople. Point your camera at your work, get real-time AI feedback.

## Tech Stack
- Expo SDK 52 + Expo Router v4
- React Native + TypeScript
- NativeWind v4 (Tailwind CSS)
- Supabase (Auth, DB, Storage)
- OpenAI Vision API (via Supabase Edge Functions)

## Setup
1. `npm install`
2. Copy `.env.example` to `.env` and fill in your Supabase credentials
3. `npx expo start`

## Documentation
See `saas-docs/` for full product documentation.

## Offline queue regression checks
Run `npm run test:offline` with Node.js 24; this focused suite needs no app
installation or provider credentials. See [tests/README.md](tests/README.md) for
coverage, failure semantics, and the same-runtime / possible-repeat-delivery limitations.
