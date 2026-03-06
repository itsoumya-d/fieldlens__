import { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 80,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-advance after 3 seconds
    const timer = setTimeout(() => {
      router.push('/onboarding/trade');
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleContinue = () => {
    router.push('/onboarding/trade');
  };

  return (
    <View className="flex-1 bg-dark-bg">
      {/* Blueprint pattern background overlay */}
      <View
        className="absolute inset-0"
        style={{
          backgroundColor: '#1C1C1E',
        }}
      >
        {/* Subtle grid pattern */}
        {Array.from({ length: 20 }).map((_, i) => (
          <View
            key={`h-${i}`}
            style={{
              position: 'absolute',
              top: i * (height / 20),
              left: 0,
              right: 0,
              height: 1,
              backgroundColor: 'rgba(232, 113, 26, 0.05)',
            }}
          />
        ))}
        {Array.from({ length: 12 }).map((_, i) => (
          <View
            key={`v-${i}`}
            style={{
              position: 'absolute',
              left: i * (width / 12),
              top: 0,
              bottom: 0,
              width: 1,
              backgroundColor: 'rgba(232, 113, 26, 0.05)',
            }}
          />
        ))}
      </View>

      {/* Orange glow effect */}
      <View
        style={{
          position: 'absolute',
          top: height * 0.15,
          left: width * 0.1,
          right: width * 0.1,
          height: height * 0.5,
          borderRadius: 9999,
          backgroundColor: 'rgba(232, 113, 26, 0.06)',
        }}
      />

      {/* Content */}
      <View className="flex-1 items-center justify-center px-8">
        {/* Logo */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          }}
          className="items-center mb-8"
        >
          {/* Logo icon */}
          <View
            className="items-center justify-center mb-4"
            style={{
              width: 96,
              height: 96,
              borderRadius: 24,
              backgroundColor: '#2C2C2E',
              borderWidth: 2,
              borderColor: '#E8711A',
              shadowColor: '#E8711A',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.4,
              shadowRadius: 20,
              elevation: 12,
            }}
          >
            <Ionicons name="eye" size={48} color="#E8711A" />
          </View>

          {/* App name */}
          <Text
            style={{
              fontSize: 40,
              fontWeight: '800',
              color: '#FFFFFF',
              letterSpacing: -1,
            }}
          >
            Field
            <Text style={{ color: '#E8711A' }}>Lens</Text>
          </Text>
        </Animated.View>

        {/* Tagline */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
          className="items-center mb-12"
        >
          <Text
            style={{
              fontSize: 20,
              color: '#EBEBF5',
              textAlign: 'center',
              lineHeight: 28,
              fontWeight: '500',
            }}
          >
            Your AI mentor on every job site.
          </Text>
          <Text
            style={{
              fontSize: 15,
              color: '#8E8E93',
              textAlign: 'center',
              marginTop: 12,
              lineHeight: 22,
              maxWidth: 280,
            }}
          >
            Point your camera at your work. Get real-time AI feedback from a master tradesperson.
          </Text>
        </Animated.View>

        {/* Feature pills */}
        <Animated.View
          style={{ opacity: fadeAnim }}
          className="flex-row flex-wrap justify-center gap-2 mb-16"
        >
          {['AI-Powered', 'Step-by-Step', 'Code Compliant', 'Offline Ready'].map((feature) => (
            <View
              key={feature}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 9999,
                backgroundColor: 'rgba(232, 113, 26, 0.15)',
                borderWidth: 1,
                borderColor: 'rgba(232, 113, 26, 0.3)',
                margin: 4,
              }}
            >
              <Text style={{ color: '#E8711A', fontSize: 13, fontWeight: '600' }}>{feature}</Text>
            </View>
          ))}
        </Animated.View>

        {/* Continue button */}
        <Animated.View style={{ opacity: fadeAnim, width: '100%' }}>
          <TouchableOpacity
            onPress={handleContinue}
            style={{
              backgroundColor: '#E8711A',
              paddingVertical: 16,
              borderRadius: 12,
              alignItems: 'center',
              shadowColor: '#E8711A',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.4,
              shadowRadius: 12,
              elevation: 8,
            }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 17, fontWeight: '700' }}>
              Get Started
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}
