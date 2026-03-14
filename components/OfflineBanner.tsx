import { useEffect, useState } from 'react';
import { View, Text, Animated } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { Ionicons } from '@expo/vector-icons';

export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const slideAnim = new Animated.Value(-60);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const offline = !state.isConnected || !state.isInternetReachable;
      setIsOffline(offline);

      Animated.spring(slideAnim, {
        toValue: offline ? 0 : -60,
        useNativeDriver: true,
      }).start();
    });

    return unsubscribe;
  }, []);

  if (!isOffline) return null;

  return (
    <Animated.View
      style={{ transform: [{ translateY: slideAnim }] }}
      className="absolute top-0 left-0 right-0 z-50 bg-red-500 px-4 py-3 flex-row items-center justify-center gap-2"
    >
      <Ionicons name="wifi-outline" size={16} color="white" />
      <Text className="text-white font-medium text-sm">No internet connection</Text>
    </Animated.View>
  );
}
