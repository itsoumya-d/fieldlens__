import { PostHog } from 'posthog-react-native';

const apiKey = process.env.EXPO_PUBLIC_POSTHOG_API_KEY ?? '';

export const posthog = apiKey
  ? new PostHog(apiKey, { host: 'https://us.i.posthog.com' })
  : null;

export function identify(userId: string, traits?: Record<string, unknown>) {
  posthog?.identify(userId, traits);
}

export function track(event: string, properties?: Record<string, unknown>) {
  posthog?.capture(event, properties);
}

export function screen(name: string, properties?: Record<string, unknown>) {
  posthog?.screen(name, properties);
}

export const Events = {
  APP_OPENED: 'App Opened',
  SCREEN_VIEWED: 'Screen Viewed',
  // FieldLens-specific
  JOB_STARTED: 'Job Started',
  PHOTO_CAPTURED: 'Photo Captured',
  JOB_COMPLETED: 'Job Completed',
  SYNC_QUEUED: 'Sync Queued',
  PAYWALL_SHOWN: 'Paywall Shown',
  TRIAL_STARTED: 'Trial Started',
  SUBSCRIBED: 'Subscribed',
} as const;
