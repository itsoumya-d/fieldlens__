import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Variant = 'primary' | 'secondary' | 'outline' | 'text' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  style?: ViewStyle;
  labelStyle?: TextStyle;
}

const variantStyles: Record<Variant, { container: ViewStyle; text: TextStyle; loader: string }> = {
  primary: {
    container: {
      backgroundColor: '#E8711A',
      shadowColor: '#E8711A',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
      elevation: 8,
    },
    text: { color: '#FFFFFF' },
    loader: '#FFFFFF',
  },
  secondary: {
    container: {
      backgroundColor: '#3A506B',
    },
    text: { color: '#FFFFFF' },
    loader: '#FFFFFF',
  },
  outline: {
    container: {
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: '#E8711A',
    },
    text: { color: '#E8711A' },
    loader: '#E8711A',
  },
  text: {
    container: {
      backgroundColor: 'transparent',
    },
    text: { color: '#E8711A' },
    loader: '#E8711A',
  },
  danger: {
    container: {
      backgroundColor: '#D32F2F',
    },
    text: { color: '#FFFFFF' },
    loader: '#FFFFFF',
  },
};

const sizeStyles: Record<Size, { container: ViewStyle; text: TextStyle; iconSize: number }> = {
  sm: {
    container: { paddingVertical: 9, paddingHorizontal: 16, borderRadius: 8 },
    text: { fontSize: 13, fontWeight: '600' },
    iconSize: 14,
  },
  md: {
    container: { paddingVertical: 13, paddingHorizontal: 20, borderRadius: 12 },
    text: { fontSize: 15, fontWeight: '700' },
    iconSize: 18,
  },
  lg: {
    container: { paddingVertical: 17, paddingHorizontal: 24, borderRadius: 14 },
    text: { fontSize: 17, fontWeight: '700' },
    iconSize: 20,
  },
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  style,
  labelStyle,
}: ButtonProps) {
  const vStyle = variantStyles[variant];
  const sStyle = sizeStyles[size];
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
          opacity: isDisabled ? 0.55 : 1,
        },
        sStyle.container,
        vStyle.container,
        style,
      ]}
      activeOpacity={0.75}
    >
      {loading ? (
        <ActivityIndicator color={vStyle.loader} size="small" />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <Ionicons name={icon} size={sStyle.iconSize} color={vStyle.text.color as string} />
          )}
          <Text style={[sStyle.text, vStyle.text, labelStyle]}>{label}</Text>
          {icon && iconPosition === 'right' && (
            <Ionicons name={icon} size={sStyle.iconSize} color={vStyle.text.color as string} />
          )}
        </>
      )}
    </TouchableOpacity>
  );
}
