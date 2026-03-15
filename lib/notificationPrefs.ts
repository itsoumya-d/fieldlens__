import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFS_KEY = '@fieldlens_notification_prefs';

export interface NotificationPrefs {
  categories: Record<string, boolean>;
  quietHoursEnabled: boolean;
  quietFrom: string; // HH:mm
  quietTo: string;   // HH:mm
}

const DEFAULT_PREFS: NotificationPrefs = {
  categories: {},
  quietHoursEnabled: false,
  quietFrom: '22:00',
  quietTo: '08:00',
};

export async function getNotificationPrefs(): Promise<NotificationPrefs> {
  try {
    const raw = await AsyncStorage.getItem(PREFS_KEY);
    if (!raw) return DEFAULT_PREFS;
    return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PREFS;
  }
}

export async function saveNotificationPrefs(prefs: NotificationPrefs): Promise<void> {
  try {
    await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {}
}

export function isCategoryEnabled(prefs: NotificationPrefs, category: string): boolean {
  // Default to true if not explicitly set
  return prefs.categories[category] !== false;
}

export function isInQuietHours(prefs: NotificationPrefs): boolean {
  if (!prefs.quietHoursEnabled) return false;
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const [fromH, fromM] = prefs.quietFrom.split(':').map(Number);
  const [toH, toM] = prefs.quietTo.split(':').map(Number);
  const fromMinutes = fromH * 60 + fromM;
  const toMinutes = toH * 60 + toM;

  // Handle overnight quiet hours (e.g., 22:00 to 08:00)
  if (fromMinutes > toMinutes) {
    return currentMinutes >= fromMinutes || currentMinutes < toMinutes;
  }
  return currentMinutes >= fromMinutes && currentMinutes < toMinutes;
}
