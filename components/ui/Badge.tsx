import React from 'react';
import { View, Text, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info' | 'secondary';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  icon?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
  labelStyle?: TextStyle;
  dot?: boolean;
}

const variantColors: Record<BadgeVariant, { bg: string; text: string; dot: string }> = {
  default: { bg: '#3A3A3C', text: '#8E8E93', dot: '#8E8E93' },
  primary: { bg: 'rgba(232, 113, 26, 0.15)', text: '#E8711A', dot: '#E8711A' },
  success: { bg: 'rgba(45, 138, 78, 0.15)', text: '#2D8A4E', dot: '#2D8A4E' },
  warning: { bg: 'rgba(249, 168, 37, 0.15)', text: '#F9A825', dot: '#F9A825' },
  error: { bg: 'rgba(211, 47, 47, 0.15)', text: '#D32F2F', dot: '#D32F2F' },
  info: { bg: 'rgba(25, 118, 210, 0.15)', text: '#1976D2', dot: '#1976D2' },
  secondary: { bg: 'rgba(58, 80, 107, 0.2)', text: '#6A8CB0', dot: '#6A8CB0' },
};

export function Badge({
  label,
  variant = 'default',
  size = 'md',
  icon,
  style,
  labelStyle,
  dot = false,
}: BadgeProps) {
  const colors = variantColors[variant];
  const isSmall = size === 'sm';

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 5,
          backgroundColor: colors.bg,
          paddingHorizontal: isSmall ? 8 : 10,
          paddingVertical: isSmall ? 2 : 4,
          borderRadius: 9999,
          alignSelf: 'flex-start',
        },
        style,
      ]}
    >
      {dot && (
        <View
          style={{
            width: isSmall ? 5 : 6,
            height: isSmall ? 5 : 6,
            borderRadius: 9999,
            backgroundColor: colors.dot,
          }}
        />
      )}
      {icon && (
        <Ionicons name={icon} size={isSmall ? 11 : 13} color={colors.text} />
      )}
      <Text
        style={[
          {
            fontSize: isSmall ? 11 : 12,
            fontWeight: '700',
            color: colors.text,
            textTransform: 'capitalize',
          },
          labelStyle,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}
