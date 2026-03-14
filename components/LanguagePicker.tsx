import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  I18nManager,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { setStoredLanguage } from '@/lib/i18n';

const LANGUAGES = [
  { code: 'en', label: 'English', nativeLabel: 'English', flag: '🇺🇸', rtl: false },
  { code: 'es', label: 'Spanish', nativeLabel: 'Español', flag: '🇪🇸', rtl: false },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी', flag: '🇮🇳', rtl: false },
  { code: 'zh', label: 'Chinese', nativeLabel: '中文', flag: '🇨🇳', rtl: false },
  { code: 'ar', label: 'Arabic', nativeLabel: 'العربية', flag: '🇸🇦', rtl: true },
  { code: 'pt', label: 'Portuguese', nativeLabel: 'Português', flag: '🇧🇷', rtl: false },
  { code: 'fr', label: 'French', nativeLabel: 'Français', flag: '🇫🇷', rtl: false },
  { code: 'de', label: 'German', nativeLabel: 'Deutsch', flag: '🇩🇪', rtl: false },
  { code: 'ja', label: 'Japanese', nativeLabel: '日本語', flag: '🇯🇵', rtl: false },
  { code: 'ko', label: 'Korean', nativeLabel: '한국어', flag: '🇰🇷', rtl: false },
];

interface LanguagePickerProps {
  currentLocale: string;
}

export function LanguagePicker({ currentLocale }: LanguagePickerProps) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  const current = LANGUAGES.find((l) => l.code === currentLocale) ?? LANGUAGES[0];

  const handleSelect = async (code: string) => {
    await setStoredLanguage(code);
    const selectedLang = LANGUAGES.find((l) => l.code === code);
    if (selectedLang?.rtl !== I18nManager.isRTL) {
      I18nManager.forceRTL(selectedLang?.rtl ?? false);
      // In production, restart the app here using expo-updates
    }
    setVisible(false);
  };

  return (
    <>
      <TouchableOpacity
        onPress={() => setVisible(true)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 14,
          borderBottomWidth: 1,
          borderBottomColor: '#3A3A3C',
        }}
        accessibilityLabel="Select language"
        accessibilityRole="button"
      >
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            backgroundColor: 'rgba(142, 142, 147, 0.12)',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
          }}
        >
          <Text style={{ fontSize: 17 }}>🌐</Text>
        </View>
        <Text
          style={{
            flex: 1,
            fontSize: 15,
            color: '#FFFFFF',
            fontWeight: '500',
          }}
        >
          {t('settings.language')}
        </Text>
        <Text style={{ fontSize: 14, color: '#8E8E93', marginRight: 6 }}>
          {current.flag} {current.nativeLabel}
        </Text>
        <Text style={{ fontSize: 14, color: '#636366' }}>›</Text>
      </TouchableOpacity>

      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: '#1C1C1E' }}>
          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 20,
              paddingTop: 24,
              paddingBottom: 16,
              borderBottomWidth: 1,
              borderBottomColor: '#3A3A3C',
            }}
          >
            <Text
              style={{
                fontSize: 20,
                fontWeight: '700',
                color: '#FFFFFF',
              }}
            >
              {t('language.selectLanguage')}
            </Text>
            <TouchableOpacity
              onPress={() => setVisible(false)}
              accessibilityLabel="Close language picker"
              accessibilityRole="button"
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: '#3A3A3C',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '600' }}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Language List */}
          <FlatList
            data={LANGUAGES}
            keyExtractor={(item) => item.code}
            contentContainerStyle={{ paddingBottom: 40 }}
            renderItem={({ item }) => {
              const isSelected = item.code === currentLocale;
              return (
                <TouchableOpacity
                  onPress={() => handleSelect(item.code)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 20,
                    paddingVertical: 16,
                    borderBottomWidth: 1,
                    borderBottomColor: '#3A3A3C',
                    backgroundColor: isSelected ? 'rgba(232, 113, 26, 0.1)' : 'transparent',
                  }}
                  accessibilityLabel={item.label}
                  accessibilityRole="button"
                >
                  <Text style={{ fontSize: 28, marginRight: 16 }}>{item.flag}</Text>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: '600',
                        color: isSelected ? '#E8711A' : '#FFFFFF',
                        marginBottom: 2,
                      }}
                    >
                      {item.nativeLabel}
                    </Text>
                    <Text
                      style={{
                        fontSize: 13,
                        color: '#8E8E93',
                      }}
                    >
                      {item.label}
                    </Text>
                  </View>
                  {isSelected && (
                    <Text style={{ color: '#E8711A', fontSize: 20, fontWeight: '700' }}>✓</Text>
                  )}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </Modal>
    </>
  );
}
