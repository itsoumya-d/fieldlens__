import { useColorScheme as useRNColorScheme } from 'react-native';

export function useTheme() {
  const colorScheme = useRNColorScheme();
  const isDark = colorScheme === 'dark';

  return {
    isDark,
    colorScheme,
    colors: {
      background: isDark ? '#0f172a' : '#ffffff',
      card: isDark ? '#1e293b' : '#f8fafc',
      text: isDark ? '#f1f5f9' : '#0f172a',
      textMuted: isDark ? '#94a3b8' : '#64748b',
      border: isDark ? '#334155' : '#e2e8f0',
      primary: '#3b82f6',
      accent: isDark ? '#60a5fa' : '#2563eb',
    },
  };
}
