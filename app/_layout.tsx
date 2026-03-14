import '@/lib/i18n'; // Initialize i18n before anything else
import { initSentry } from '@/lib/sentry';
initSentry();
import { useEffect, useState } from 'react';
import { Linking, Platform, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { isBiometricEnabled, authenticateWithBiometrics } from '@/lib/biometrics';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useLastNotificationResponse } from 'expo-notifications';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';
import OfflineBanner from '@/components/OfflineBanner';
import '../global.css';

SplashScreen.preventAutoHideAsync();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!Device.isDevice) return null;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return null;

  const token = await Notifications.getExpoPushTokenAsync({
    projectId: process.env.EXPO_PUBLIC_PROJECT_ID ?? 'your-project-id',
  });

  return token.data;
}

export default function RootLayout() {
  const { setSession, setUser, setLoading } = useAuthStore();
  const notificationResponse = useLastNotificationResponse();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const [biometricLocked, setBiometricLocked] = useState(true);
  const [fontsLoaded] = useFonts({
    'Inter-Regular': require('../assets/fonts/Inter-Regular.ttf'),
    'Inter-Medium': require('../assets/fonts/Inter-Medium.ttf'),
    'Inter-SemiBold': require('../assets/fonts/Inter-SemiBold.ttf'),
    'Inter-Bold': require('../assets/fonts/Inter-Bold.ttf'),
  });

  useEffect(() => {
    async function checkBiometric() {
      const enabled = await isBiometricEnabled();
      if (!enabled) {
        setBiometricLocked(false);
        return;
      }
      const success = await authenticateWithBiometrics('Authenticate to access the app');
      setBiometricLocked(!success);
    }
    checkBiometric();
  }, []);

  useEffect(() => {
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
      });
    }

    // Clear badge on app open
    Notifications.setBadgeCountAsync(0);

    // Register for push notifications and save token to Supabase
    registerForPushNotificationsAsync().then(async (token) => {
      if (!token) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .update({ expo_push_token: token })
          .eq('id', user.id);
      }
    });
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  useEffect(() => {
    if (notificationResponse?.notification?.request?.content?.data) {
      const data = notificationResponse.notification.request.content.data as Record<string, string>;
      if (data.screen) {
        router.push(data.screen as any);
      }
    }
  }, [notificationResponse]);

  useEffect(() => {
    // Handle deep links when app is already open
    const subscription = Linking.addEventListener('url', ({ url }) => {
      console.log('Deep link received:', url);
      // expo-router handles the actual navigation automatically
    });
    return () => subscription.remove();
  }, []);

  if (!fontsLoaded) return null;

  if (biometricLocked) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-gray-950">
        <View className="items-center gap-4 p-8">
          <View className="h-20 w-20 rounded-full bg-[#6366F1]/10 items-center justify-center">
            <Ionicons name="lock-closed" size={36} color="#6366F1" />
          </View>
          <Text className="text-xl font-bold text-gray-900 dark:text-white">App Locked</Text>
          <Text className="text-sm text-gray-500 dark:text-gray-400 text-center">
            Authenticate to continue
          </Text>
          <TouchableOpacity
            onPress={async () => {
              const success = await authenticateWithBiometrics('Authenticate to access the app');
              if (success) setBiometricLocked(false);
            }}
            className="mt-2 px-6 py-3 rounded-xl bg-[#6366F1] active:opacity-80"
          >
            <Text className="text-white font-semibold text-base">Unlock</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View className={`flex-1 ${colorScheme === 'dark' ? 'dark' : ''}`}>
        <OfflineBanner />
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="auth" />
          <Stack.Screen name="(tabs)" />
        </Stack>
      </View>
    </GestureHandlerRootView>
  );
}
