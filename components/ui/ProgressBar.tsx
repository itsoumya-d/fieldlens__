import React, { useEffect, useRef } from 'react';
import { View, Animated, ViewStyle } from 'react-native';

interface ProgressBarProps {
  progress: number; // 0 to 1
  color?: string;
  backgroundColor?: string;
  height?: number;
  borderRadius?: number;
  animated?: boolean;
  style?: ViewStyle;
}

export function ProgressBar({
  progress,
  color = '#E8711A',
  backgroundColor = '#3A3A3C',
  height = 6,
  borderRadius = 3,
  animated = true,
  style,
}: ProgressBarProps) {
  const animValue = useRef(new Animated.Value(0)).current;
  const clampedProgress = Math.min(1, Math.max(0, progress));

  useEffect(() => {
    if (animated) {
      Animated.spring(animValue, {
        toValue: clampedProgress,
        tension: 60,
        friction: 10,
        useNativeDriver: false,
      }).start();
    } else {
      animValue.setValue(clampedProgress);
    }
  }, [clampedProgress]);

  return (
    <View
      style={[
        {
          height,
          borderRadius,
          backgroundColor,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View
        style={{
          height: '100%',
          borderRadius,
          backgroundColor: color,
          width: animValue.interpolate({
            inputRange: [0, 1],
            outputRange: ['0%', '100%'],
          }),
        }}
      />
    </View>
  );
}
