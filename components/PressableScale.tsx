import { Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';
import Animated, { useSharedValue, withSpring, useAnimatedStyle } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { ReactNode } from 'react';

interface PressableScaleProps extends Omit<PressableProps, 'style'> {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  scale?: number;
  haptic?: 'light' | 'medium' | 'heavy' | 'none';
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function PressableScale({ children, style, scale = 0.96, haptic = 'light', onPress, ...props }: PressableScaleProps) {
  const pressed = useSharedValue(false);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(pressed.value ? scale : 1, { damping: 15, stiffness: 300, mass: 0.6 }) }],
  }));

  return (
    <AnimatedPressable
      style={[animStyle, style]}
      onPressIn={() => {
        pressed.value = true;
        if (haptic !== 'none') Haptics.impactAsync(
          haptic === 'heavy' ? Haptics.ImpactFeedbackStyle.Heavy :
          haptic === 'medium' ? Haptics.ImpactFeedbackStyle.Medium :
          Haptics.ImpactFeedbackStyle.Light
        );
      }}
      onPressOut={() => { pressed.value = false; }}
      onPress={onPress}
      {...props}
    >
      {children}
    </AnimatedPressable>
  );
}
