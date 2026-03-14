import * as StoreReview from 'expo-store-review';
import AsyncStorage from '@react-native-async-storage/async-storage';

const REVIEW_KEY = 'review_requested';
const ACTION_COUNT_KEY = 'action_count';

export async function trackAction() {
  const count = parseInt(await AsyncStorage.getItem(ACTION_COUNT_KEY) || '0', 10) + 1;
  await AsyncStorage.setItem(ACTION_COUNT_KEY, count.toString());

  // Request review after 3rd successful action, only once
  if (count === 3) {
    const alreadyRequested = await AsyncStorage.getItem(REVIEW_KEY);
    if (!alreadyRequested && await StoreReview.hasAction()) {
      await StoreReview.requestReview();
      await AsyncStorage.setItem(REVIEW_KEY, 'true');
    }
  }
}
