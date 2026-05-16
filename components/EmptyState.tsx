import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown, useSharedValue, withRepeat, withSequence, withTiming, useAnimatedStyle } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import PressableScale from './PressableScale';
import { useColorScheme } from 'nativewind';
import { useEffect } from 'react';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  primaryColor?: string;
  variant?: 'default' | 'compact';
}

export default function EmptyState({
  icon = 'folder-open-outline',
  title,
  description,
  actionLabel,
  onAction,
  primaryColor = '#2563EB',
  variant = 'default',
}: EmptyStateProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const float = useSharedValue(0);

  useEffect(() => {
    float.value = withRepeat(
      withSequence(
        withTiming(-6, { duration: 1800 }),
        withTiming(0, { duration: 1800 })
      ),
      -1,
      true
    );
  }, []);

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: float.value }],
  }));

  const textColor = isDark ? '#F1F5F9' : '#1A1A2E';
  const subColor = isDark ? '#94A3B8' : '#64748B';
  const iconBg = `${primaryColor}15`;

  if (variant === 'compact') {
    return (
      <Animated.View entering={FadeInDown.duration(400)} style={styles.compactWrap}>
        <View style={[styles.compactIcon, { backgroundColor: iconBg }]}>
          <Ionicons name={icon} size={24} color={primaryColor} />
        </View>
        <Text style={[styles.compactTitle, { color: textColor }]}>{title}</Text>
        <Text style={[styles.compactDesc, { color: subColor }]}>{description}</Text>
        {actionLabel && onAction && (
          <PressableScale onPress={onAction} style={[styles.compactBtn, { backgroundColor: primaryColor }]}>
            <Text style={styles.compactBtnText}>{actionLabel}</Text>
          </PressableScale>
        )}
      </Animated.View>
    );
  }

  return (
    <Animated.View entering={FadeInDown.duration(500)} style={styles.wrap}>
      <Animated.View style={[styles.iconWrap, { backgroundColor: iconBg }, floatStyle]}>
        <View style={[styles.iconInner, { borderColor: `${primaryColor}30` }]}>
          <Ionicons name={icon} size={44} color={primaryColor} />
        </View>
      </Animated.View>
      <Text style={[styles.title, { color: textColor }]}>{title}</Text>
      <Text style={[styles.desc, { color: subColor }]}>{description}</Text>
      {actionLabel && onAction && (
        <PressableScale onPress={onAction} style={[styles.btn, { backgroundColor: primaryColor }]} haptic="medium">
          <Text style={styles.btnText}>{actionLabel}</Text>
        </PressableScale>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingVertical: 48 },
  iconWrap: { width: 104, height: 104, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 28 },
  iconInner: { width: 80, height: 80, borderRadius: 24, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '700', textAlign: 'center', marginBottom: 10, letterSpacing: -0.3 },
  desc: { fontSize: 15, textAlign: 'center', lineHeight: 22, marginBottom: 32, maxWidth: 280 },
  btn: { paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  btnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  compactWrap: { alignItems: 'center', paddingVertical: 32, paddingHorizontal: 24 },
  compactIcon: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  compactTitle: { fontSize: 16, fontWeight: '700', textAlign: 'center', marginBottom: 6 },
  compactDesc: { fontSize: 13, textAlign: 'center', lineHeight: 18, marginBottom: 16 },
  compactBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  compactBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
});
