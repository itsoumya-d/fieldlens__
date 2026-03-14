import * as Sentry from "@sentry/react-native";

export function initSentry() {
  Sentry.init({
    dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 1.0,
    debug: __DEV__,
    enabled: !__DEV__,
    attachStacktrace: true,
  });
}

export { Sentry };
