import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Dimensions,
  StyleSheet,
  Animated,
  StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import PressableScale from '@/components/PressableScale';

const { width } = Dimensions.get('window');

const STORAGE_KEY = '@fieldlens_user_type';

const PERSONALIZATION_OPTIONS = [
  'Electrician',
  'Plumber',
  'HVAC technician',
  'Carpenter / Woodworker',
  'Mason / Concrete',
  'Painter / Drywall',
  'General laborer',
];

interface Slide {
  emoji: string;
  title: string;
  description: string;
  bg: string;
  accentBg: string;
  tag: string;
}

const slides: Slide[] = [
  {
    emoji: '🔧',
    title: 'Master your trade faster',
    description:
      'Fieldlens gives you a real-time AI coach in your pocket — just point your camera at your work and get instant expert feedback on technique, safety, and quality',
    bg: '#0f1923',
    accentBg: '#1a2a3a',
    tag: 'AI TRADE COACH',
  },
  {
    emoji: '⚡',
    title: 'Join 52,000 tradespeople',
    description:
      'Electricians, plumbers, HVAC techs, and carpenters use Fieldlens to learn 40% faster, catch mistakes before they cost money, and build certifiable skills',
    bg: '#0d3349',
    accentBg: '#0e4d7e',
    tag: 'TRUSTED BY THOUSANDS',
  },
  {
    emoji: '⚒️',
    title: "What's your primary trade?",
    description: "We'll customize your AI coaching for your specific work",
    bg: '#0369a1',
    accentBg: '#0e4d7e',
    tag: 'PERSONALIZE',
  },
];

export default function Onboarding() {
  const { t } = useTranslation();
  const [current, setCurrent] = useState(0);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(1 / slides.length)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: (current + 1) / slides.length,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [current]);

  useEffect(() => {
    if (current === slides.length - 1) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
          Animated.timing(shimmerAnim, { toValue: 0.85, duration: 1000, useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
  }, [current]);

  const animateTransition = (nextIndex: number) => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 160, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -24, duration: 160, useNativeDriver: true }),
    ]).start(() => {
      setCurrent(nextIndex);
      slideAnim.setValue(24);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 240, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 90, friction: 12 }),
      ]).start();
    });
  };

  async function handleNext() {
    if (current < slides.length - 1) {
      animateTransition(current + 1);
    } else {
      if (selectedType) {
        await AsyncStorage.setItem(STORAGE_KEY, selectedType);
      }
      await AsyncStorage.setItem('onboarding_completed', 'true');
      router.replace('/(auth)/login');
    }
  }

  function handleSkip() {
    AsyncStorage.setItem('onboarding_completed', 'true');
    router.replace('/(auth)/login');
  }

  const slide = slides[current];
  const isLast = current === slides.length - 1;
  const canProceed = !isLast || selectedType !== null;
  const progressWidth = progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <View style={[styles.container, { backgroundColor: slide.bg }]}>
      <StatusBar barStyle="light-content" />
      <View style={[styles.topAccent, { backgroundColor: slide.accentBg }]} />
      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
      </View>
      {!isLast && (
        <PressableScale haptic="light" style={styles.skipBtn} onPress={handleSkip}>
          <Text style={styles.skipText}>{t('onboarding.skip')}</Text>
        </PressableScale>
      )}
      <Animated.View
        style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
      >
        <View style={styles.tag}>
          <Text style={styles.tagText}>{slide.tag}</Text>
        </View>
        <View style={[styles.emojiContainer, { backgroundColor: slide.accentBg }]}>
          <Text style={styles.emoji}>{slide.emoji}</Text>
        </View>
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.description}>{slide.description}</Text>

        {isLast && (
          <ScrollView
            style={styles.optionsScroll}
            contentContainerStyle={styles.optionsContainer}
            showsVerticalScrollIndicator={false}
          >
            {PERSONALIZATION_OPTIONS.map((option) => {
              const isSelected = selectedType === option;
              return (
                <PressableScale
                  key={option}
                  haptic="none"
                  scale={0.97}
                  style={[styles.optionChip, isSelected && styles.optionChipSelected]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedType(option);
                  }}
                >
                  {isSelected && <Text style={styles.optionCheck}>✓ </Text>}
                  <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                    {option}
                  </Text>
                </PressableScale>
              );
            })}
          </ScrollView>
        )}
      </Animated.View>
      <View style={styles.dots}>
        {slides.map((_, i) => (
          <Animated.View
            key={i}
            style={[
              styles.dot,
              { width: i === current ? 28 : 8, opacity: i === current ? 1 : 0.35 },
            ]}
          />
        ))}
      </View>
      <Animated.View
        style={[
          styles.buttonWrap,
          isLast && {
            opacity: shimmerAnim.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }),
          },
        ]}
      >
        <PressableScale
          haptic="medium"
          style={[
            styles.button,
            isLast && { backgroundColor: canProceed ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.3)' },
          ]}
          onPress={handleNext}
          disabled={!canProceed}
        >
          <Text style={[styles.buttonText, isLast && canProceed && { color: slide.bg }]}>
            {isLast ? `🚀  ${t('onboarding.getStarted')}` : `${t('onboarding.continue')} \u2192`}
          </Text>
        </PressableScale>
      </Animated.View>
      <Text style={styles.stepCounter}>
        {t('onboarding.stepOf', { current: current + 1, total: slides.length })}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
    opacity: 0.6,
  },
  progressTrack: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  progressFill: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 2,
  },
  skipBtn: {
    position: 'absolute',
    top: 56,
    right: 24,
    zIndex: 10,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  skipText: { color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: '600' },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 60,
  },
  tag: {
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  tagText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  emojiContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 36,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  emoji: { fontSize: 56 },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.78)',
    textAlign: 'center',
    lineHeight: 26,
    maxWidth: 320,
  },
  optionsScroll: {
    width: '100%',
    marginTop: 24,
    maxHeight: 260,
  },
  optionsContainer: {
    gap: 10,
    paddingBottom: 8,
  },
  optionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  optionChipSelected: {
    borderColor: 'rgba(255,255,255,0.9)',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  optionCheck: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  optionText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 15,
    fontWeight: '600',
  },
  optionTextSelected: {
    color: '#fff',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 20,
  },
  dot: { height: 8, borderRadius: 4, backgroundColor: '#fff' },
  buttonWrap: { marginHorizontal: 24, marginBottom: 16 },
  button: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: '800', letterSpacing: 0.3 },
  stepCounter: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 36,
  },
});
