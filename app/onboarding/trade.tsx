import { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/auth';
import PressableScale from '@/components/PressableScale';

type Trade = 'plumbing' | 'electrical' | 'hvac' | 'carpentry' | 'other';

interface TradeOption {
  id: Trade;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
  available: boolean;
}

const TRADES: TradeOption[] = [
  {
    id: 'plumbing',
    label: 'Plumbing',
    icon: 'water',
    description: 'Pipe fitting, drainage, water systems',
    available: true,
  },
  {
    id: 'electrical',
    label: 'Electrical',
    icon: 'flash',
    description: 'Wiring, panels, circuits',
    available: true,
  },
  {
    id: 'hvac',
    label: 'HVAC',
    icon: 'thermometer',
    description: 'Heating, cooling, ventilation',
    available: true,
  },
  {
    id: 'carpentry',
    label: 'Carpentry',
    icon: 'hammer',
    description: 'Framing, finish work, cabinetry',
    available: true,
  },
  {
    id: 'other',
    label: 'General',
    icon: 'construct',
    description: 'Other skilled trades',
    available: true,
  },
];

export default function TradeScreen() {
  const [selected, setSelected] = useState<Trade | null>(null);
  const { setTrade } = useAuthStore();

  const handleSelect = (trade: Trade, available: boolean) => {
    if (!available) return;
    setSelected(trade);
  };

  const handleContinue = () => {
    if (!selected) return;
    setTrade(selected);
    router.push('/onboarding/experience');
  };

  return (
    <View className="flex-1 bg-dark-bg">
      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="pt-4 pb-8">
          <Text
            style={{
              fontSize: 13,
              color: '#E8711A',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: 1.5,
              marginBottom: 8,
            }}
          >
            Step 1 of 4
          </Text>
          <Text
            style={{
              fontSize: 28,
              color: '#FFFFFF',
              fontWeight: '700',
              marginBottom: 8,
            }}
          >
            What is your trade?
          </Text>
          <Text style={{ fontSize: 15, color: '#8E8E93', lineHeight: 22 }}>
            We'll customize your AI coaching and task guides for your specific trade.
          </Text>
        </View>

        {/* Trade cards */}
        <View style={{ gap: 12, paddingBottom: 24 }}>
          {TRADES.map((trade) => {
            const isSelected = selected === trade.id;
            const isDisabled = !trade.available;

            return (
              <PressableScale
                key={trade.id}
                accessibilityRole="button"
                onPress={() => handleSelect(trade.id, trade.available)}
                haptic="light"
                disabled={isDisabled}
                style={{
                  backgroundColor: isSelected ? 'rgba(232, 113, 26, 0.12)' : '#2C2C2E',
                  borderRadius: 16,
                  borderWidth: 2,
                  borderColor: isSelected ? '#E8711A' : isDisabled ? '#38383A' : '#3A3A3C',
                  padding: 20,
                  opacity: isDisabled ? 0.5 : 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                {/* Icon */}
                <View
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 12,
                    backgroundColor: isSelected ? 'rgba(232, 113, 26, 0.2)' : '#3A3A3C',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 16,
                  }}
                >
                  <Ionicons
                    name={trade.icon}
                    size={26}
                    color={isSelected ? '#E8711A' : isDisabled ? '#636366' : '#EBEBF5'}
                  />
                </View>

                {/* Text */}
                <View className="flex-1">
                  <View className="flex-row items-center gap-2">
                    <Text
                      style={{
                        fontSize: 17,
                        fontWeight: '600',
                        color: isDisabled ? '#636366' : '#FFFFFF',
                      }}
                    >
                      {trade.label}
                    </Text>
                    {isDisabled && (
                      <View
                        style={{
                          backgroundColor: '#3A3A3C',
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                          borderRadius: 9999,
                        }}
                      >
                        <Text style={{ fontSize: 11, color: '#8E8E93', fontWeight: '600' }}>
                          Coming Soon
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text
                    style={{
                      fontSize: 13,
                      color: isDisabled ? '#636366' : '#8E8E93',
                      marginTop: 2,
                    }}
                  >
                    {trade.description}
                  </Text>
                </View>

                {/* Selection indicator */}
                {isSelected && (
                  <View
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      backgroundColor: '#E8711A',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                  </View>
                )}
              </PressableScale>
            );
          })}
        </View>
      </ScrollView>

      {/* Continue button */}
      <View className="px-6 pb-6">
        <PressableScale
          accessibilityRole="button"
          onPress={handleContinue}
          haptic="medium"
          disabled={!selected}
          style={{
            backgroundColor: selected ? '#E8711A' : '#3A3A3C',
            paddingVertical: 16,
            borderRadius: 12,
            alignItems: 'center',
            shadowColor: selected ? '#E8711A' : 'transparent',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.4,
            shadowRadius: 12,
            elevation: selected ? 8 : 0,
          }}
        >
          <Text
            style={{
              color: selected ? '#FFFFFF' : '#636366',
              fontSize: 17,
              fontWeight: '700',
            }}
          >
            Continue
          </Text>
        </PressableScale>
      </View>
    </View>
  );
}
