import { Linking } from 'react-native';

const APP_SCHEME = 'fieldlens';
const WEB_DOMAIN = 'https://fieldlens.app';

/**
 * Build a deep link URL that works both as universal link and custom scheme
 * e.g., deepLink('dashboard') → 'fieldlens://dashboard' or 'https://fieldlens.app/dashboard'
 */
export function deepLink(path: string, useUniversal = false): string {
  if (useUniversal) return `${WEB_DOMAIN}/${path}`;
  return `${APP_SCHEME}://${path}`;
}

/**
 * Open a deep link URL
 */
export async function openDeepLink(path: string): Promise<boolean> {
  const url = deepLink(path);
  const canOpen = await Linking.canOpenURL(url);
  if (canOpen) {
    await Linking.openURL(url);
    return true;
  }
  return false;
}

/**
 * Share a deep link (e.g., share a specific item)
 */
export function getShareableLink(path: string): string {
  return deepLink(path, true); // Use universal link for sharing
}
