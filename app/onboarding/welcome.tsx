import { useEffect } from 'react';
import { View, Text, Dimensions, StatusBar, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useCameraPermissions } from 'expo-camera';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withRepeat,
  withSequence,
  withDelay,
  FadeInDown,
  FadeInUp,
  Easing,
} from 'react-native-reanimated';
import PressableScale from '@/components/PressableScale';

const { width, height } = Dimensions.get('window');
const PRIMARY = '#E8711A';
const BG = '#0A0F1E';

const FEATURES = [
  { icon: 'eye-outline' as const, label: 'AI job-site vision' },
  { icon: 'checkmark-circle-outline' as const, label: 'Code compliance' },
  { icon: 'cloud-offline-outline' as const, label: 'Offline ready' },
];

export default function WelcomeScreen() {
  const [, requestCameraPermission] = useCameraPermissions();
  const glowOpacity = useSharedValue(0.12);
  const logoScale = useSharedValue(0.75);
  const logoOpacity = useSharedValue(0);

  useEffect(() => {
    logoOpacity.value = withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) });
    logoScale.value = withSpring(1, { damping: 14, stiffness: 90, mass: 0.8 });
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.22, { duration: 2000 }),
        withTiming(0.12, { duration: 2000 })
      ),
      -1,
      false
    );
  }, []);

  const glowStyle = useAnimatedStyle(() => ({ opacity: glowOpacity.value }));
  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const handleGetStarted = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await requestCameraPermission();
    router.push('/onboarding/trade');
  };

  const handleSignIn = () => {
    Haptics.selectionAsync();
    router.push('/auth/login');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <Animated.View style={[styles.glowBlob, { backgroundColor: PRIMARY }, glowStyle]} />

      {/* Subtle grid */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {Array.from({ length: 8 }).map((_, i) => (
          <View key={`h${i}`} style={[styles.gridH, { top: (i + 1) * (height / 9) }]} />
        ))}
        {Array.from({ length: 5 }).map((_, i) => (
          <View key={`v${i}`} style={[styles.gridV, { left: (i + 1) * (width / 6) }]} />
        ))}
      </View>

      <View style={styles.content}>
        {/* Logo */}
        <Animated.View style={[styles.logoWrap, logoStyle]}>
          <View style={[styles.logoBox, { borderColor: PRIMARY, shadowColor: PRIMARY }]}>
            <Ionicons name="construct" size={48} color={PRIMARY} />
          </View>
          <Text style={styles.appName}>
            Field<Text style={{ color: PRIMARY }}>Lens</Text>
          </Text>
        </Animated.View>

        {/* Tagline */}
        <Animated.View entering={FadeInDown.delay(120).springify().damping(14)} style={styles.taglineWrap}>
          <Text style={styles.tagline}>
            {'AI coaching for\neveryone in the trades'}
          </Text>
          <Text style={styles.subtext}>
            Point your camera at the work. Get real-time guidance from a master tradesperson — on every job, every day.
          </Text>
        </Animated.View>

        {/* Feature pills */}
        <Animated.View entering={FadeInDown.delay(220).springify().damping(14)} style={styles.pillRow}>
          {FEATURES.map(({ icon, label }) => (
            <View key={label} style={[styles.pill, { borderColor: `${PRIMARY}55`, backgroundColor: `${PRIMARY}18` }]}>
              <Ionicons name={icon} size={14} color={PRIMARY} />
              <Text style={[styles.pillText, { color: PRIMARY }]}>{label}</Text>
            </View>
          ))}
        </Animated.View>

        {/* Trust line */}
        <Animated.View entering={FadeInDown.delay(300).springify().damping(14)} style={styles.trustRow}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Ionicons key={i} name="star" size={12} color="#FBBF24" />
          ))}
          <Text style={styles.trustText}>  Trusted by 12,000+ tradespeople</Text>
        </Animated.View>

        {/* CTAs */}
        <Animated.View entering={FadeInUp.delay(350).springify().damping(14)} style={styles.ctaWrap}>
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="Get Started Free"
            onPress={handleGetStarted}
            haptic="medium"
            style={[styles.primaryBtn, { backgroundColor: PRIMARY, shadowColor: PRIMARY }]}
          >
            <Text style={styles.primaryBtnText}>Get Started Free</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={{ marginLeft: 8 }} />
          </PressableScale>

          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="Sign in to existing account"
            onPress={handleSignIn}
            haptic="light"
            style={styles.secondaryBtn}
          >
            <Text style={styles.secondaryBtnText}>Already have an account?  Sign in</Text>
          </PressableScale>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  glowBlob: {
    position: 'absolute',
    top: height * 0.05,
    left: width * 0.1,
    right: width * 0.1,
    height: height * 0.45,
    borderRadius: 9999,
  },
  gridH: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: 'rgba(232, 113, 26, 0.06)' },
  gridV: { position: 'absolute', top: 0, bottom: 0, width: 1, backgroundColor: 'rgba(232, 113, 26, 0.06)' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28, paddingBottom: 20 },
  logoWrap: { alignItems: 'center', marginBottom: 28 },
  logoBox: {
    width: 96,
    height: 96,
    borderRadius: 28,
    backgroundColor: 'rgba(232, 113, 26, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
    elevation: 12,
  },
  appName: { fontSize: 42, fontWeight: '800', color: '#FFFFFF', letterSpacing: -1.5 },
  taglineWrap: { alignItems: 'center', marginBottom: 24 },
  tagline: {
    fontSize: 22,
    fontWeight: '700',
    color: '#F1F5F9',
    textAlign: 'center',
    lineHeight: 30,
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  subtext: { fontSize: 15, color: '#64748B', textAlign: 'center', lineHeight: 22, maxWidth: 300 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginBottom: 20 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  pillText: { fontSize: 12, fontWeight: '600', letterSpacing: 0.2 },
  trustRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 32 },
  trustText: { color: '#475569', fontSize: 13 },
  ctaWrap: { width: '100%', gap: 12 },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 10,
  },
  primaryBtnText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700', letterSpacing: 0.3 },
  secondaryBtn: { alignItems: 'center', paddingVertical: 10 },
  secondaryBtnText: { color: '#475569', fontSize: 14 },
});
