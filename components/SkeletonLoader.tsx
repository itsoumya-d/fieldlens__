import { useEffect, useState } from 'react';
import { AccessibilityInfo, View, StyleSheet, ViewStyle, useColorScheme } from 'react-native';
import Animated, {
  useSharedValue, withRepeat, withTiming,
  useAnimatedStyle, cancelAnimation, Easing, SharedValue,
} from 'react-native-reanimated';

// ── Reduced motion hook ───────────────────────────────────────────────────────
function useReduceMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduce);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduce);
    return () => sub.remove();
  }, []);
  return reduce;
}

// ── Shimmer animation hook ────────────────────────────────────────────────────
function useShimmer(reduceMotion: boolean): SharedValue<number> {
  const x = useSharedValue(-200);
  useEffect(() => {
    if (reduceMotion) { x.value = -200; return; }
    x.value = withRepeat(
      withTiming(600, { duration: 1400, easing: Easing.linear }),
      -1, false
    );
    return () => cancelAnimation(x);
  }, [reduceMotion]);
  return x;
}

// ── Internal shimmer block (synced to parent SharedValue) ─────────────────────
function ShimmerBlock({ width, height, style, radius = 8, shimmerX }: {
  width: number | string; height: number; style?: ViewStyle; radius?: number;
  shimmerX: SharedValue<number>;
}) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme !== 'light';
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerX.value }],
  }));
  return (
    <View style={[{
      width: width as any, height, borderRadius: radius,
      backgroundColor: isDark ? '#1E293B' : '#E5E7EB',
      overflow: 'hidden',
    }, style]}>
      <Animated.View style={[{
        position: 'absolute', top: 0, bottom: 0, width: 90,
        backgroundColor: isDark ? 'rgba(255,255,255,0.055)' : 'rgba(255,255,255,0.6)',
      }, animStyle]} />
    </View>
  );
}

// ── Base shimmer block (standalone — creates own shimmer) ─────────────────────
export function SkeletonBlock({ width, height, style, radius = 8 }: {
  width: number | string; height: number; style?: ViewStyle; radius?: number;
}) {
  const reduceMotion = useReduceMotion();
  const shimmerX = useShimmer(reduceMotion);
  return <ShimmerBlock width={width} height={height} style={style} radius={radius} shimmerX={shimmerX} />;
}

// ── Skeleton card (generic) ───────────────────────────────────────────────────
export function SkeletonCard({ lines = 3, style }: { lines?: number; style?: ViewStyle }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme !== 'light';
  const reduceMotion = useReduceMotion();
  const shimmerX = useShimmer(reduceMotion);
  const bg = isDark ? '#1F2937' : '#FFFFFF';
  const border = isDark ? '#374151' : '#F3F4F6';
  return (
    <View style={[styles.card, { backgroundColor: bg, borderColor: border }, style]}>
      <ShimmerBlock width="60%" height={14} shimmerX={shimmerX} />
      {Array.from({ length: lines - 1 }).map((_, i) => (
        <ShimmerBlock key={i} width={i === lines - 2 ? '40%' : '90%'} height={11} style={{ marginTop: 10 }} shimmerX={shimmerX} />
      ))}
    </View>
  );
}

// ── KPI / stat row ────────────────────────────────────────────────────────────
export function SkeletonKPI() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme !== 'light';
  const reduceMotion = useReduceMotion();
  const shimmerX = useShimmer(reduceMotion);
  const bg = isDark ? '#1F2937' : '#FFFFFF';
  return (
    <View style={styles.kpiRow}>
      {[0, 1, 2].map(i => (
        <View key={i} style={[styles.kpiCard, { backgroundColor: bg }]}>
          <ShimmerBlock width={48} height={32} radius={6} shimmerX={shimmerX} />
          <ShimmerBlock width="70%" height={10} style={{ marginTop: 8 }} shimmerX={shimmerX} />
        </View>
      ))}
    </View>
  );
}

// ── List item row ─────────────────────────────────────────────────────────────
export function SkeletonListItem({ showAvatar = false }: { showAvatar?: boolean }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme !== 'light';
  const reduceMotion = useReduceMotion();
  const shimmerX = useShimmer(reduceMotion);
  const bg = isDark ? '#1F2937' : '#FFFFFF';
  return (
    <View style={[styles.listItem, { backgroundColor: bg }]}>
      {showAvatar && <ShimmerBlock width={40} height={40} radius={20} shimmerX={shimmerX} />}
      <View style={{ flex: 1, gap: 8 }}>
        <ShimmerBlock width="55%" height={13} shimmerX={shimmerX} />
        <ShimmerBlock width="75%" height={10} shimmerX={shimmerX} />
      </View>
      <ShimmerBlock width={60} height={22} radius={12} shimmerX={shimmerX} />
    </View>
  );
}

// ── Feed skeleton (multiple cards) ───────────────────────────────────────────
export function SkeletonFeed({ count = 4, showAvatar = false }: { count?: number; showAvatar?: boolean }) {
  return (
    <View style={styles.feed}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonListItem key={i} showAvatar={showAvatar} />
      ))}
    </View>
  );
}

// ── Profile / header skeleton ─────────────────────────────────────────────────
export function SkeletonProfile() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme !== 'light';
  const reduceMotion = useReduceMotion();
  const shimmerX = useShimmer(reduceMotion);
  const bg = isDark ? '#1F2937' : '#FFFFFF';
  return (
    <View style={[styles.profileCard, { backgroundColor: bg }]}>
      <ShimmerBlock width={72} height={72} radius={36} shimmerX={shimmerX} />
      <View style={{ flex: 1, gap: 10, paddingLeft: 16 }}>
        <ShimmerBlock width="60%" height={16} shimmerX={shimmerX} />
        <ShimmerBlock width="45%" height={12} shimmerX={shimmerX} />
        <ShimmerBlock width="30%" height={24} radius={12} shimmerX={shimmerX} />
      </View>
    </View>
  );
}

// ── Chart placeholder ────────────────────────────────────────────────────────
export function SkeletonChart() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme !== 'light';
  const reduceMotion = useReduceMotion();
  const shimmerX = useShimmer(reduceMotion);
  const bg = isDark ? '#1F2937' : '#FFFFFF';
  return (
    <View style={[styles.chartCard, { backgroundColor: bg }]}>
      <ShimmerBlock width="40%" height={13} shimmerX={shimmerX} />
      <View style={styles.chartBars}>
        {[60, 85, 40, 95, 55, 75, 45].map((h, i) => (
          <ShimmerBlock key={i} width={24} height={h} radius={4} style={{ alignSelf: 'flex-end' }} shimmerX={shimmerX} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 14, padding: 16, borderWidth: 1, marginBottom: 10 },
  kpiRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  kpiCard: { flex: 1, borderRadius: 14, padding: 14, alignItems: 'flex-start' },
  listItem: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, padding: 14, marginBottom: 8 },
  feed: { gap: 0 },
  profileCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, padding: 18, marginBottom: 12 },
  chartCard: { borderRadius: 14, padding: 16, marginBottom: 10 },
  chartBars: { flexDirection: 'row', gap: 6, alignItems: 'flex-end', marginTop: 16, height: 100 },
});
