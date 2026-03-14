import { TouchableOpacity, Text } from 'react-native';
import { useColorScheme, Appearance } from 'react-native';
import * as Haptics from 'expo-haptics';

export default function DarkModeToggle() {
  const colorScheme = useColorScheme();

  const toggle = () => {
    Haptics.selectionAsync();
    Appearance.setColorScheme(colorScheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <TouchableOpacity
      onPress={toggle}
      className="flex-row items-center justify-between p-3 bg-gray-100 dark:bg-gray-800 rounded-xl"
      accessibilityRole="switch"
      accessibilityLabel={`${colorScheme === 'dark' ? 'Disable' : 'Enable'} dark mode`}
    >
      <Text className="text-base font-medium text-gray-900 dark:text-gray-100">Dark Mode</Text>
      <Text className="text-2xl">{colorScheme === 'dark' ? '🌙' : '☀️'}</Text>
    </TouchableOpacity>
  );
}
