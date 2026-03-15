import { Platform, NativeModules } from 'react-native';

// Call this after loading jobs to update the iOS widget.
// On iOS: writes to App Group UserDefaults so the WidgetKit extension can read it.
// On Android: (future) updates RemoteViews via AppWidget manager.
export async function updateOpenJobs(count: number): Promise<void> {
  if (Platform.OS !== 'ios') return;
  try {
    // Uses the native SharedUserDefaults module (available after expo prebuild)
    // If not available (Expo Go), fails silently
    const SharedUserDefaults = NativeModules.SharedUserDefaults;
    if (SharedUserDefaults?.setInteger) {
      await SharedUserDefaults.setInteger(count, 'fieldlens_open_jobs', 'group.com.fieldlens.app');
    }
  } catch {
    // Widget update is non-critical — fail silently in Expo Go
  }
}
