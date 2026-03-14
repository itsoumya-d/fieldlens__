import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({ icon = 'folder-open-outline', title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center px-8 py-16">
      <View className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-6">
        <Ionicons name={icon} size={36} color="#9ca3af" />
      </View>
      <Text className="text-xl font-semibold text-gray-900 text-center mb-2">{title}</Text>
      <Text className="text-base text-gray-500 text-center mb-8 leading-relaxed">{description}</Text>
      {actionLabel && onAction && (
        <TouchableOpacity
          onPress={onAction}
          className="bg-blue-600 px-6 py-3 rounded-xl"
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
        >
          <Text className="text-white font-semibold text-base">{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
