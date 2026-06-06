import '@/lib/i18n'; // Initialize i18n before anything else
import { useEffect, useState } from 'react';
import { Linking, Platform, Text, useColorScheme, View } from 'react-native';
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
import ErrorBoundary from '@/components/ErrorBoundary';
import { initSentry } from '@/lib/sentry';
import PressableScale from '@/components/PressableScale';
import '../global.css';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import { identify, track, Events } from '@/lib/analytics';

initSentry();

SplashScreen.preventAutoHideAsync();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
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
    // RevenueCat + PostHog init
    const rcKey = Platform.select({
      ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY,
      android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY,
    });
    if (rcKey) {
      if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.DEBUG);
      Purchases.configure({ apiKey: rcKey });
    }
    track(Events.APP_OPENED, { app: 'fieldlens', platform: Platform.OS });
  }, []);

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
      if (session?.user) {
        identify(session.user.id, { email: session.user.email });
        Purchases.logIn(session.user.id).catch(() => {});
      }
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        identify(session.user.id, { email: session.user.email });
        Purchases.logIn(session.user.id).catch(() => {});
      } else {
        Purchases.logOut().catch(() => {});
      }
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
    // Handle deep links when app is already open (foreground)
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });
    // Handle the initial URL that launched the app (cold start)
    Linking.getInitialURL().then(url => {
      if (url) handleDeepLink(url);
    });
    return () => subscription.remove();
  }, []);

  if (!fontsLoaded) return null;

  if (biometricLocked) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-gray-950">
        <View className="items-center gap-4 p-8">
          <View className="h-20 w-20 rounded-full bg-[#2563EB]/10 items-center justify-center">
            <Ionicons name="lock-closed" size={36} color="#2563EB" />
          </View>
          <Text className="text-xl font-bold text-gray-900 dark:text-white">App Locked</Text>
          <Text className="text-sm text-gray-500 dark:text-gray-400 text-center">
            Authenticate to continue
          </Text>
          <PressableScale
            haptic="medium"
            onPress={async () => {
              const success = await authenticateWithBiometrics('Authenticate to access the app');
              if (success) setBiometricLocked(false);
            }}
            className="mt-2 px-6 py-3 rounded-xl bg-[#2563EB]"
          >
            <Text className="text-white font-semibold text-base">Unlock</Text>
          </PressableScale>
        </View>
      </View>
    );
  }

  // Handle Universal Links, App Links, and custom scheme deep links.
  // Called both on cold start (getInitialURL) and when app is in foreground.
  function handleDeepLink(url: string) {
    if (!url) return;
    try {
      const parsed = new URL(url);
      const pathname = parsed.pathname;
      const params = Object.fromEntries(parsed.searchParams.entries());

      // Auth callback from Supabase OAuth / magic link / password reset
      if (pathname.includes('/auth/callback') || pathname.includes('/auth/confirm')) {
        const token = params.token_hash || params.token;
        const type = params.type;
        if (type === 'recovery') {
          router.replace({ pathname: '/(auth)/reset-password' as any, params: { token } });
        } else if (type === 'signup' || type === 'magiclink') {
          router.replace('/(tabs)/' as any);
        } else {
          router.replace('/(tabs)/' as any);
        }
        return;
      }

      // Reset password link
      if (pathname.includes('/reset-password')) {
        router.replace({ pathname: '/(auth)/reset-password' as any, params });
        return;
      }

      // Notification tap deep links: /link/[screen]
      if (pathname.startsWith('/link/')) {
        const screen = pathname.replace('/link/', '');
        if (screen) router.push(('/' + screen) as any);
        return;
      }

      // Shared content: /shared/[type]/[id]
      if (pathname.startsWith('/shared/')) {
        router.push(pathname as any);
        return;
      }

      // Custom scheme: appname://screen/[params]
      if (url.startsWith(parsed.protocol) && !url.startsWith('http')) {
        const path = pathname.startsWith('/') ? pathname : '/' + pathname;
        if (path && path !== '/') router.push(path as any);
      }
    } catch {
      // Malformed URL — ignore
    }
  }

  return (
    <ErrorBoundary>
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
    </ErrorBoundary>
  );
}
