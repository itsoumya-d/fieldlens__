import { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';
import { useColorScheme } from 'nativewind';

// ── Pulse animation hook ──────────────────────────────────────────────────────
function usePulse() {
  const anim = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    ).start();
    return () => anim.stopAnimation();
  }, [anim]);
  return anim;
}

// ── Base shimmer block ────────────────────────────────────────────────────────
export function SkeletonBlock({ width, height, style, radius = 8 }: {
  width: number | string; height: number; style?: ViewStyle; radius?: number;
}) {
  const { colorScheme } = useColorScheme();
  const opacity = usePulse();
  const bg = colorScheme === 'dark' ? '#374151' : '#E5E7EB';
  return (
    <Animated.View
      style={[{ width: width as number, height, borderRadius: radius, backgroundColor: bg, opacity }, style]}
    />
  );
}

// ── Skeleton card (generic) ───────────────────────────────────────────────────
export function SkeletonCard({ lines = 3, style }: { lines?: number; style?: ViewStyle }) {
  const { colorScheme } = useColorScheme();
  const bg = colorScheme === 'dark' ? '#1F2937' : '#FFFFFF';
  const border = colorScheme === 'dark' ? '#374151' : '#F3F4F6';
  return (
    <View style={[styles.card, { backgroundColor: bg, borderColor: border }, style]}>
      <SkeletonBlock width="60%" height={14} />
      {Array.from({ length: lines - 1 }).map((_, i) => (
        <SkeletonBlock key={i} width={i === lines - 2 ? '40%' : '90%'} height={11} style={{ marginTop: 10 }} />
      ))}
    </View>
  );
}

// ── KPI / stat row ────────────────────────────────────────────────────────────
export function SkeletonKPI() {
  const { colorScheme } = useColorScheme();
  const bg = colorScheme === 'dark' ? '#1F2937' : '#FFFFFF';
  return (
    <View style={[styles.kpiRow]}>
      {[0, 1, 2].map(i => (
        <View key={i} style={[styles.kpiCard, { backgroundColor: bg }]}>
          <SkeletonBlock width={48} height={32} radius={6} />
          <SkeletonBlock width="70%" height={10} style={{ marginTop: 8 }} />
        </View>
      ))}
    </View>
  );
}

// ── List item row ─────────────────────────────────────────────────────────────
export function SkeletonListItem({ showAvatar = false }: { showAvatar?: boolean }) {
  const { colorScheme } = useColorScheme();
  const bg = colorScheme === 'dark' ? '#1F2937' : '#FFFFFF';
  return (
    <View style={[styles.listItem, { backgroundColor: bg }]}>
      {showAvatar && <SkeletonBlock width={40} height={40} radius={20} />}
      <View style={{ flex: 1, gap: 8 }}>
        <SkeletonBlock width="55%" height={13} />
        <SkeletonBlock width="75%" height={10} />
      </View>
      <SkeletonBlock width={60} height={22} radius={12} />
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
  const { colorScheme } = useColorScheme();
  const bg = colorScheme === 'dark' ? '#1F2937' : '#FFFFFF';
  return (
    <View style={[styles.profileCard, { backgroundColor: bg }]}>
      <SkeletonBlock width={72} height={72} radius={36} />
      <View style={{ flex: 1, gap: 10, paddingLeft: 16 }}>
        <SkeletonBlock width="60%" height={16} />
        <SkeletonBlock width="45%" height={12} />
        <SkeletonBlock width="30%" height={24} radius={12} />
      </View>
    </View>
  );
}

// ── Chart placeholder ────────────────────────────────────────────────────────
export function SkeletonChart() {
  const { colorScheme } = useColorScheme();
  const bg = colorScheme === 'dark' ? '#1F2937' : '#FFFFFF';
  return (
    <View style={[styles.chartCard, { backgroundColor: bg }]}>
      <SkeletonBlock width="40%" height={13} />
      <View style={styles.chartBars}>
        {[60, 85, 40, 95, 55, 75, 45].map((h, i) => (
          <SkeletonBlock key={i} width={24} height={h} radius={4} style={{ alignSelf: 'flex-end' }} />
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
