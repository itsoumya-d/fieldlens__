import { useEffect } from 'react';
import { Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  visible: boolean;
  message: string;
  type?: ToastType;
  onHide?: () => void;
  duration?: number;
}

const TYPE_CONFIG = {
  success: { color: '#22C55E', bg: '#022C22', icon: 'checkmark-circle' as const },
  error: { color: '#EF4444', bg: '#2D0A0A', icon: 'close-circle' as const },
  warning: { color: '#F59E0B', bg: '#2D1A00', icon: 'warning' as const },
  info: { color: '#3B82F6', bg: '#0A1A2D', icon: 'information-circle' as const },
};

export default function Toast({ visible, message, type = 'success', onHide, duration = 3000 }: ToastProps) {
  const cfg = TYPE_CONFIG[type];

  useEffect(() => {
    if (visible) {
      Haptics.notificationAsync(
        type === 'success' ? Haptics.NotificationFeedbackType.Success :
        type === 'error' ? Haptics.NotificationFeedbackType.Error :
        Haptics.NotificationFeedbackType.Warning
      );
      const t = setTimeout(() => onHide?.(), duration);
      return () => clearTimeout(t);
    }
  }, [visible, type, duration]);

  if (!visible) return null;

  return (
    <Animated.View
      entering={FadeInDown.springify().damping(15)}
      exiting={FadeOutDown.duration(200)}
      style={[styles.container, { backgroundColor: cfg.bg, borderColor: `${cfg.color}40` }]}
    >
      <Ionicons name={cfg.icon} size={20} color={cfg.color} />
      <Text style={styles.message}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    zIndex: 9999,
  },
  message: { flex: 1, fontSize: 14, fontWeight: '600', lineHeight: 20, color: '#FFFFFF' },
});
