import * as StoreReview from 'expo-store-review';
import AsyncStorage from '@react-native-async-storage/async-storage';

const REVIEW_KEY = '@fieldlens_last_review';
const REVIEW_INTERVAL_MS = 60 * 24 * 60 * 60 * 1000; // 60 days

/**
 * Prompt the user for a store review, rate-limited to once per 60 days.
 * Silently no-ops when unavailable or within the cooldown window.
 */
export async function triggerReview(): Promise<void> {
  try {
    const isAvailable = await StoreReview.isAvailableAsync();
    if (!isAvailable) return;

    const lastReview = await AsyncStorage.getItem(REVIEW_KEY);
    if (lastReview) {
      const elapsed = Date.now() - parseInt(lastReview, 10);
      if (elapsed < REVIEW_INTERVAL_MS) return;
    }

    await StoreReview.requestReview();
    await AsyncStorage.setItem(REVIEW_KEY, Date.now().toString());
  } catch {
    // Silently fail — review prompts must never break the app
  }
}
