import React, { useEffect, useRef } from 'react';
import { Animated, View, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  visible: boolean;
  message: string;
  type?: ToastType;
  duration?: number;
  onDismiss?: () => void;
  action?: {
    label: string;
    onPress: () => void;
  };
}

const typeConfig: Record<ToastType, { icon: keyof typeof Ionicons.glyphMap; color: string; bg: string }> = {
  success: { icon: 'checkmark-circle', color: '#2D8A4E', bg: 'rgba(45, 138, 78, 0.15)' },
  error: { icon: 'close-circle', color: '#D32F2F', bg: 'rgba(211, 47, 47, 0.15)' },
  warning: { icon: 'warning', color: '#F9A825', bg: 'rgba(249, 168, 37, 0.15)' },
  info: { icon: 'information-circle', color: '#1976D2', bg: 'rgba(25, 118, 210, 0.15)' },
};

export function Toast({
  visible,
  message,
  type = 'info',
  duration = 3000,
  onDismiss,
  action,
}: ToastProps) {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const config = typeConfig[type];

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          tension: 80,
          friction: 10,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      if (duration > 0) {
        const timer = setTimeout(() => {
          hide();
        }, duration);
        return () => clearTimeout(timer);
      }
    } else {
      hide();
    }
  }, [visible]);

  const hide = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss?.();
    });
  };

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: 60,
        left: 16,
        right: 16,
        zIndex: 9999,
        transform: [{ translateY }],
        opacity,
      }}
    >
      <View
        style={{
          backgroundColor: '#2C2C2E',
          borderRadius: 14,
          padding: 14,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          borderWidth: 1,
          borderColor: config.color + '40',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.4,
          shadowRadius: 10,
          elevation: 10,
        }}
      >
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: config.bg,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name={config.icon} size={18} color={config.color} />
        </View>
        <Text style={{ flex: 1, color: '#FFFFFF', fontSize: 14, fontWeight: '500' }}>
          {message}
        </Text>
        {action && (
          <TouchableOpacity onPress={action.onPress}>
            <Text style={{ color: config.color, fontSize: 13, fontWeight: '700' }}>
              {action.label}
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={hide} style={{ padding: 2 }}>
          <Ionicons name="close" size={16} color="#8E8E93" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}
