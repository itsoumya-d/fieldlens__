import { useEffect, useRef } from 'react';
import { View, Text, Animated, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/auth';
import PressableScale from '@/components/PressableScale';

const { width } = Dimensions.get('window');

const DEMO_ITEMS = [
  { icon: 'camera', label: 'Point Camera', color: '#E8711A' },
  { icon: 'flash', label: 'AI Analyzes', color: '#F9A825' },
  { icon: 'checkmark-circle', label: 'Get Feedback', color: '#2D8A4E' },
];

export default function DemoScreen() {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const { setOnboardingComplete } = useAuthStore();

  useEffect(() => {
    // Fade in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    // Pulse animation for CTA button
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.06,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  const handleGetStarted = () => {
    setOnboardingComplete(true);
    router.replace('/auth/signup');
  };

  const handleSkip = () => {
    setOnboardingComplete(true);
    router.replace('/auth/login');
  };

  return (
    <Animated.View style={{ flex: 1, opacity: fadeAnim }} className="bg-dark-bg">
      <View className="flex-1 px-6">
        {/* Header */}
        <View className="pt-4 pb-6">
          <Text
            style={{
              fontSize: 13,
              color: '#E8711A',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: 1.5,
              marginBottom: 8,
            }}
          >
            Step 4 of 4
          </Text>
          <Text style={{ fontSize: 28, color: '#FFFFFF', fontWeight: '700', marginBottom: 8 }}>
            See FieldLens in action
          </Text>
          <Text style={{ fontSize: 15, color: '#8E8E93', lineHeight: 22 }}>
            Real-time AI coaching, right from your phone camera.
          </Text>
        </View>

        {/* Demo Preview */}
        <View
          style={{
            backgroundColor: '#2C2C2E',
            borderRadius: 20,
            overflow: 'hidden',
            marginBottom: 32,
            borderWidth: 1,
            borderColor: '#3A3A3C',
          }}
        >
          {/* Simulated camera viewfinder */}
          <View
            style={{
              height: 220,
              backgroundColor: '#1C1C1E',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
          >
            {/* Corner brackets */}
            {[
              { top: 16, left: 16 },
              { top: 16, right: 16 },
              { bottom: 16, left: 16 },
              { bottom: 16, right: 16 },
            ].map((style, i) => (
              <View
                key={i}
                style={{
                  position: 'absolute',
                  ...style,
                  width: 24,
                  height: 24,
                  borderColor: '#E8711A',
                  borderTopWidth: i < 2 ? 3 : 0,
                  borderBottomWidth: i >= 2 ? 3 : 0,
                  borderLeftWidth: i % 2 === 0 ? 3 : 0,
                  borderRightWidth: i % 2 === 1 ? 3 : 0,
                }}
              />
            ))}

            {/* Pipe illustration */}
            <View style={{ alignItems: 'center' }}>
              <Ionicons name="water-outline" size={64} color="rgba(232, 113, 26, 0.3)" />
            </View>

            {/* Scan line */}
            <View
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                height: 2,
                top: '45%',
                backgroundColor: 'rgba(232, 113, 26, 0.5)',
              }}
            />

            {/* AI Badge */}
            <View
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                backgroundColor: 'rgba(232, 113, 26, 0.9)',
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 8,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#FFFFFF' }} />
              <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '700' }}>AI ACTIVE</Text>
            </View>
          </View>

          {/* Result overlay */}
          <View
            style={{
              backgroundColor: 'rgba(45, 138, 78, 0.15)',
              borderTopWidth: 1,
              borderTopColor: '#2D8A4E',
              padding: 16,
              flexDirection: 'row',
              alignItems: 'flex-start',
              gap: 12,
            }}
          >
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: 'rgba(45, 138, 78, 0.2)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="checkmark-circle" size={22} color="#2D8A4E" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#2D8A4E', fontSize: 15, fontWeight: '700', marginBottom: 2 }}>
                Joint looks good
              </Text>
              <Text style={{ color: '#8E8E93', fontSize: 13, lineHeight: 18 }}>
                Pipe connection appears properly sealed. Slope looks adequate for drainage.
              </Text>
            </View>
          </View>
        </View>

        {/* How it works */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 32 }}>
          {DEMO_ITEMS.map((item, index) => (
            <View key={item.label} style={{ flex: 1, alignItems: 'center' }}>
              <View
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 26,
                  backgroundColor: `${item.color}20`,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 8,
                }}
              >
                <Ionicons name={item.icon as any} size={24} color={item.color} />
              </View>
              <Text style={{ color: '#EBEBF5', fontSize: 12, fontWeight: '600', textAlign: 'center' }}>
                {item.label}
              </Text>
              {index < DEMO_ITEMS.length - 1 && (
                <View
                  style={{
                    position: 'absolute',
                    right: -4,
                    top: 25,
                    width: 8,
                    height: 2,
                    backgroundColor: '#3A3A3C',
                  }}
                />
              )}
            </View>
          ))}
        </View>
      </View>

      {/* Bottom CTAs */}
      <View className="px-6 pb-6 gap-3">
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <PressableScale
            accessibilityRole="button"
            onPress={handleGetStarted}
            haptic="medium"
            style={{
              backgroundColor: '#E8711A',
              paddingVertical: 16,
              borderRadius: 12,
              alignItems: 'center',
              shadowColor: '#E8711A',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.5,
              shadowRadius: 16,
              elevation: 10,
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <Ionicons name="camera" size={20} color="#FFFFFF" />
            <Text style={{ color: '#FFFFFF', fontSize: 17, fontWeight: '700' }}>
              Try It Now — It's Free
            </Text>
          </PressableScale>
        </Animated.View>

        <PressableScale
          accessibilityRole="button"
          onPress={handleSkip}
          haptic="light"
          style={{ alignItems: 'center', paddingVertical: 12 }}
        >
          <Text style={{ color: '#8E8E93', fontSize: 15, fontWeight: '500' }}>
            I'll explore on my own
          </Text>
        </PressableScale>
      </View>
    </Animated.View>
  );
}
