import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

interface Props {
  focused: boolean;
  color: string;
  children: React.ReactNode;
}

// Spring physics matching PressableScale for consistency
const SPRING = { damping: 15, stiffness: 300, mass: 0.6 };

export default function AnimatedTabIcon({ focused, color, children }: Props) {
  const scale = useSharedValue(1);
  const dotScale = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    scale.value = withSpring(focused ? 1.12 : 1, SPRING);
    dotScale.value = withSpring(focused ? 1 : 0, { damping: 18, stiffness: 400 });
  }, [focused]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const dotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: dotScale.value }],
    opacity: dotScale.value,
  }));

  return (
    <View style={{ alignItems: 'center', gap: 3 }}>
      <Animated.View style={iconStyle}>{children}</Animated.View>
      <Animated.View
        style={[
          {
            width: 4,
            height: 4,
            borderRadius: 2,
            backgroundColor: color,
          },
          dotStyle,
        ]}
      />
    </View>
  );
}
