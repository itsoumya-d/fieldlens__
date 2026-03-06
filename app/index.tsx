import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuthStore } from '@/store/auth';

export default function Index() {
  const { session, loading, onboardingComplete } = useAuthStore();

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-dark-bg">
        <ActivityIndicator color="#E8711A" size="large" />
      </View>
    );
  }

  if (!onboardingComplete) return <Redirect href="/onboarding/welcome" />;
  if (!session) return <Redirect href="/auth/login" />;
  return <Redirect href="/(tabs)" />;
}
