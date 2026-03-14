import { Platform } from 'react-native';

// PostHog analytics wrapper
// Initialize with your PostHog project API key from environment
const POSTHOG_KEY = process.env.EXPO_PUBLIC_POSTHOG_KEY || '';

export const analytics = {
  identify: (userId: string, traits?: Record<string, unknown>) => {
    if (!POSTHOG_KEY) return;
    // PostHog identify call
    console.log('[Analytics] identify:', userId, traits);
  },
  track: (event: string, properties?: Record<string, unknown>) => {
    if (!POSTHOG_KEY) return;
    console.log('[Analytics] track:', event, { platform: Platform.OS, ...properties });
  },
  screen: (screenName: string, properties?: Record<string, unknown>) => {
    if (!POSTHOG_KEY) return;
    console.log('[Analytics] screen:', screenName, properties);
  },
  reset: () => {
    console.log('[Analytics] reset');
  },
};

// Standard events
export const Events = {
  SIGNUP: 'user_signup',
  LOGIN: 'user_login',
  ONBOARDING_COMPLETE: 'onboarding_complete',
  FEATURE_USED: 'feature_used',
  SUBSCRIPTION_STARTED: 'subscription_started',
  SUBSCRIPTION_CANCELLED: 'subscription_cancelled',
  ERROR_OCCURRED: 'error_occurred',
} as const;
