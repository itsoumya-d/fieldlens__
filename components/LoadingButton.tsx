import { Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import PressableScale from './PressableScale';
import Animated, { FadeIn } from 'react-native-reanimated';

interface LoadingButtonProps {
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  label: string;
  loadingLabel?: string;
  primaryColor?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  haptic?: 'light' | 'medium' | 'heavy';
}

export default function LoadingButton({
  onPress, loading = false, disabled = false, label, loadingLabel, primaryColor = '#6366F1', style, textStyle, haptic = 'medium',
}: LoadingButtonProps) {
  const isDisabled = loading || disabled;

  return (
    <PressableScale
      onPress={onPress}
      disabled={isDisabled}
      haptic={isDisabled ? 'none' : haptic}
      style={[styles.btn, { backgroundColor: isDisabled ? '#94A3B8' : primaryColor }, style]}
      scale={0.97}
    >
      {loading ? (
        <Animated.View entering={FadeIn.duration(150)} style={styles.loadingRow}>
          <ActivityIndicator color="#FFFFFF" size="small" />
          {loadingLabel && <Text style={[styles.label, textStyle]}>{loadingLabel}</Text>}
        </Animated.View>
      ) : (
        <Animated.Text entering={FadeIn.duration(150)} style={[styles.label, textStyle]}>{label}</Animated.Text>
      )}
    </PressableScale>
  );
}

export { LoadingButton };

const styles = StyleSheet.create({
  btn: { paddingVertical: 15, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
