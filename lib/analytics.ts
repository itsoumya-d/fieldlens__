import { Platform } from 'react-native';
import PostHog from 'posthog-react-native';

// PostHog analytics — fully wired with posthog-react-native SDK
const POSTHOG_KEY = process.env.EXPO_PUBLIC_POSTHOG_KEY || '';
const POSTHOG_HOST = process.env.EXPO_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

let posthogClient: PostHog | null = null;

function getClient(): PostHog | null {
  if (posthogClient) return posthogClient;
  if (!POSTHOG_KEY) return null;
  try {
    posthogClient = new PostHog(POSTHOG_KEY, { host: POSTHOG_HOST, enableSessionReplay: false });
  } catch (err) {
    console.warn('[Analytics] PostHog init failed:', err);
  }
  return posthogClient;
}

// Auto-initialize on import
getClient();

export const analytics = {
  identify: async (userId: string, traits?: Record<string, unknown>) => {
    const client = getClient();
    if (!client) return;
    client.identify(userId, traits as any);
  },

  track: async (event: string, properties?: Record<string, unknown>) => {
    const client = getClient();
    if (!client) return;
    client.capture(event, { platform: Platform.OS, ...properties } as any);
  },

  screen: async (screenName: string, properties?: Record<string, unknown>) => {
    const client = getClient();
    if (!client) return;
    client.screen(screenName, properties as any);
  },

  reset: async () => {
    const client = getClient();
    if (!client) return;
    client.reset();
  },

  flush: async () => {
    const client = getClient();
    if (!client) return;
    await client.flush();
  },

  getClient: () => posthogClient,
};

export const Events = {
  SIGNUP: 'user_signup',
  LOGIN: 'user_login',
  ONBOARDING_COMPLETE: 'onboarding_complete',
  FEATURE_USED: 'feature_used',
  SUBSCRIPTION_STARTED: 'subscription_started',
  SUBSCRIPTION_CANCELLED: 'subscription_cancelled',
  ERROR_OCCURRED: 'error_occurred',
} as const;
