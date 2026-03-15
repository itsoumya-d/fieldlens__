import { Platform } from 'react-native';
import PostHog from 'posthog-react-native';

// PostHog analytics — fully wired with posthog-react-native SDK
const POSTHOG_KEY = process.env.EXPO_PUBLIC_POSTHOG_KEY || '';
const POSTHOG_HOST = process.env.EXPO_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

let posthogClient: PostHog | null = null;
let initPromise: Promise<void> | null = null;

async function ensureInitialized(): Promise<PostHog | null> {
  if (posthogClient) return posthogClient;
  if (!POSTHOG_KEY) return null;

  if (!initPromise) {
    initPromise = PostHog.initAsync(POSTHOG_KEY, {
      host: POSTHOG_HOST,
      enableSessionReplay: false,
    }).then((client) => {
      posthogClient = client;
    }).catch((err) => {
      console.warn('[Analytics] PostHog init failed:', err);
      posthogClient = null;
    });
  }

  await initPromise;
  return posthogClient;
}

// Auto-initialize on import
ensureInitialized();

export const analytics = {
  identify: async (userId: string, traits?: Record<string, unknown>) => {
    const client = await ensureInitialized();
    if (!client) return;
    client.identify(userId, traits);
  },

  track: async (event: string, properties?: Record<string, unknown>) => {
    const client = await ensureInitialized();
    if (!client) return;
    client.capture(event, { platform: Platform.OS, ...properties });
  },

  screen: async (screenName: string, properties?: Record<string, unknown>) => {
    const client = await ensureInitialized();
    if (!client) return;
    client.screen(screenName, properties);
  },

  reset: async () => {
    const client = await ensureInitialized();
    if (!client) return;
    client.reset();
  },

  /** Flush pending events — call before app backgrounding */
  flush: async () => {
    const client = await ensureInitialized();
    if (!client) return;
    await client.flush();
  },

  /** Get the PostHog client instance for advanced usage */
  getClient: () => posthogClient,
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
