import { Stack, usePathname } from 'expo-router';
import { View, TouchableOpacity, Text } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

const PAGES = [
  '/onboarding/welcome',
  '/onboarding/trade',
  '/onboarding/experience',
  '/onboarding/demo',
];

export default function OnboardingLayout() {
  const pathname = usePathname();
  const currentIndex = PAGES.indexOf(pathname);

  const handleSkip = () => {
    router.replace('/auth/login');
  };

  return (
    <View className="flex-1 bg-dark-bg">
      <SafeAreaView className="flex-1">
        {/* Header with skip button */}
        <View className="flex-row justify-end px-6 pt-2">
          {currentIndex < PAGES.length - 1 && (
            <TouchableOpacity onPress={handleSkip} className="py-2 px-4">
              <Text className="text-dark-elevated text-base font-medium" style={{ color: '#8E8E93' }}>
                Skip
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Stack content */}
        <View className="flex-1">
          <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />
        </View>

        {/* Progress dots */}
        <View className="flex-row justify-center items-center pb-8 gap-2">
          {PAGES.map((_, index) => (
            <View
              key={index}
              className="rounded-full"
              style={{
                width: index === currentIndex ? 24 : 8,
                height: 8,
                backgroundColor: index === currentIndex ? '#E8711A' : '#38383A',
              }}
            />
          ))}
        </View>
      </SafeAreaView>
    </View>
  );
}
