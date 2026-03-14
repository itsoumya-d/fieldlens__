import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import all translation files
import en from '../locales/en.json';
import es from '../locales/es.json';
import hi from '../locales/hi.json';
import zh from '../locales/zh.json';
import ar from '../locales/ar.json';
import pt from '../locales/pt.json';
import fr from '../locales/fr.json';
import de from '../locales/de.json';
import ja from '../locales/ja.json';
import ko from '../locales/ko.json';

const LANGUAGE_KEY = '@fieldlens_language';

export const getStoredLanguage = async (): Promise<string> => {
  try {
    const stored = await AsyncStorage.getItem(LANGUAGE_KEY);
    if (stored) return stored;
  } catch {}
  return Localization.getLocales()[0]?.languageCode ?? 'en';
};

export const setStoredLanguage = async (lang: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(LANGUAGE_KEY, lang);
    await i18n.changeLanguage(lang);
  } catch {}
};

const deviceLocale = Localization.getLocales()[0]?.languageCode ?? 'en';
const supportedLocales = ['en', 'es', 'hi', 'zh', 'ar', 'pt', 'fr', 'de', 'ja', 'ko'];
const initialLocale = supportedLocales.includes(deviceLocale) ? deviceLocale : 'en';

i18n.use(initReactI18next).init({
  compatibilityJSON: 'v3',
  lng: initialLocale,
  fallbackLng: 'en',
  resources: {
    en: { translation: en },
    es: { translation: es },
    hi: { translation: hi },
    zh: { translation: zh },
    ar: { translation: ar },
    pt: { translation: pt },
    fr: { translation: fr },
    de: { translation: de },
    ja: { translation: ja },
    ko: { translation: ko },
  },
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
