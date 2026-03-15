import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';

const DSN = process.env.EXPO_PUBLIC_SENTRY_DSN ?? '';

// Initialize Sentry — called once at app startup
export function initSentry() {
  if (!DSN) return;
  Sentry.init({
    dsn: DSN,
    environment: __DEV__ ? 'development' : 'production',
    release: `FieldLens@${Constants.expoConfig?.version ?? '1.0.0'}`,
    dist: Constants.expoConfig?.ios?.buildNumber ?? Constants.expoConfig?.android?.versionCode?.toString() ?? '1',

    // Performance
    tracesSampleRate: __DEV__ ? 1.0 : 0.1,
    profilesSampleRate: 0.05,

    // Filter noise
    beforeSend(event, hint) {
      const error = hint?.originalException;
      if (error instanceof Error) {
        if (
          error.message?.includes('Network request failed') ||
          error.message?.includes('AbortError') ||
          error.message?.includes('cancelled')
        ) {
          return null;
        }
      }
      return event;
    },

    enableAutoPerformanceTracing: true,
    enableAutoSessionTracking: true,
    sessionTrackingIntervalMillis: 30000,
  });
}

// Identify user after login
export function identifySentryUser(userId: string, email?: string) {
  Sentry.setUser({ id: userId, email });
}

// Clear user on logout
export function clearSentryUser() {
  Sentry.setUser(null);
}

// Capture an exception with optional context
export function captureError(error: unknown, context?: Record<string, unknown>) {
  if (!DSN) return;
  Sentry.withScope(scope => {
    if (context) {
      Object.entries(context).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }
    Sentry.captureException(error);
  });
}

// Capture a breadcrumb for debugging
export function addBreadcrumb(message: string, category = 'app', data?: Record<string, unknown>) {
  Sentry.addBreadcrumb({ message, category, data, level: 'info' });
}

// Wrap a navigation component for route tracking
export const SentryNavigationWrapper = Sentry.wrap;
