import { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/auth';

type Level = 'apprentice' | 'journeyman' | 'master';

interface LevelOption {
  id: Level;
  label: string;
  subtitle: string;
  years: string;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
  accentColor: string;
}

const LEVELS: LevelOption[] = [
  {
    id: 'apprentice',
    label: 'Apprentice',
    subtitle: 'Learning the craft',
    years: '0–3 years',
    icon: 'school',
    description: 'Detailed step-by-step guidance with extensive explanations and safety reminders.',
    accentColor: '#2D8A4E',
  },
  {
    id: 'journeyman',
    label: 'Journeyman',
    subtitle: 'Skilled and confident',
    years: '3–8 years',
    icon: 'construct',
    description: 'Balanced guidance with code references and efficiency tips for common tasks.',
    accentColor: '#1976D2',
  },
  {
    id: 'master',
    label: 'Master',
    subtitle: 'Expert tradesperson',
    years: '8+ years',
    icon: 'star',
    description: 'Quick checklists, advanced techniques, and code compliance verification.',
    accentColor: '#E8711A',
  },
];

export default function ExperienceScreen() {
  const [selected, setSelected] = useState<Level | null>(null);
  const { setExperienceLevel } = useAuthStore();

  const handleContinue = () => {
    if (!selected) return;
    setExperienceLevel(selected);
    router.push('/onboarding/demo');
  };

  return (
    <View className="flex-1 bg-dark-bg">
      <View className="flex-1 px-6">
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
            Step 2 of 4
          </Text>
          <Text
            style={{
              fontSize: 28,
              color: '#FFFFFF',
              fontWeight: '700',
              marginBottom: 8,
            }}
          >
            How experienced are you?
          </Text>
          <Text style={{ fontSize: 15, color: '#8E8E93', lineHeight: 22 }}>
            Your experience level helps us tailor the AI coaching depth and detail.
          </Text>
        </View>

        {/* Level cards */}
        <View style={{ gap: 16, flex: 1 }}>
          {LEVELS.map((level) => {
            const isSelected = selected === level.id;

            return (
              <TouchableOpacity
                key={level.id}
                onPress={() => setSelected(level.id)}
                style={{
                  backgroundColor: isSelected ? `${level.accentColor}15` : '#2C2C2E',
                  borderRadius: 16,
                  borderWidth: 2,
                  borderColor: isSelected ? level.accentColor : '#3A3A3C',
                  padding: 20,
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  flex: 1,
                }}
              >
                {/* Icon */}
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 14,
                    backgroundColor: isSelected ? `${level.accentColor}25` : '#3A3A3C',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 16,
                  }}
                >
                  <Ionicons
                    name={level.icon}
                    size={28}
                    color={isSelected ? level.accentColor : '#8E8E93'}
                  />
                </View>

                {/* Content */}
                <View style={{ flex: 1 }}>
                  <View className="flex-row items-center justify-between mb-1">
                    <Text style={{ fontSize: 18, fontWeight: '700', color: '#FFFFFF' }}>
                      {level.label}
                    </Text>
                    {/* Years badge */}
                    <View
                      style={{
                        backgroundColor: isSelected ? `${level.accentColor}25` : '#3A3A3C',
                        paddingHorizontal: 10,
                        paddingVertical: 3,
                        borderRadius: 9999,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          color: isSelected ? level.accentColor : '#8E8E93',
                          fontWeight: '600',
                        }}
                      >
                        {level.years}
                      </Text>
                    </View>
                  </View>

                  <Text style={{ fontSize: 13, color: '#8E8E93', marginBottom: 6, fontWeight: '500' }}>
                    {level.subtitle}
                  </Text>

                  <Text style={{ fontSize: 13, color: '#636366', lineHeight: 18 }}>
                    {level.description}
                  </Text>
                </View>

                {/* Selected checkmark */}
                {isSelected && (
                  <View
                    style={{
                      position: 'absolute',
                      top: 16,
                      right: 16,
                      width: 22,
                      height: 22,
                      borderRadius: 11,
                      backgroundColor: level.accentColor,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Continue button */}
      <View className="px-6 pb-6 pt-4">
        <TouchableOpacity
          onPress={handleContinue}
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
        </TouchableOpacity>
      </View>
    </View>
  );
}
