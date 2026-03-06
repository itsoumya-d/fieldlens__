import React from 'react';
import { View, ViewStyle } from 'react-native';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  elevated?: boolean;
  variant?: 'default' | 'outlined' | 'accent';
  padding?: number;
}

export function Card({
  children,
  style,
  elevated = false,
  variant = 'default',
  padding = 16,
}: CardProps) {
  const borderColor = {
    default: '#3A3A3C',
    outlined: '#636366',
    accent: 'rgba(232, 113, 26, 0.3)',
  }[variant];

  const backgroundColor = {
    default: '#2C2C2E',
    outlined: '#2C2C2E',
    accent: 'rgba(232, 113, 26, 0.08)',
  }[variant];

  return (
    <View
      style={[
        {
          backgroundColor,
          borderRadius: 16,
          padding,
          borderWidth: 1,
          borderColor,
          ...(elevated
            ? {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 6,
              }
            : {}),
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
