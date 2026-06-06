export const Colors = {
  primary: '#2563EB',
  primaryLight: '#3B82F6',
  primaryDark: '#1D4ED8',

  secondary: '#3A506B',
  secondaryLight: '#4D6A8F',
  secondaryDark: '#2A3C50',

  success: '#2D8A4E',
  successLight: '#3AAD64',
  successDark: '#1E6035',

  error: '#D32F2F',
  errorLight: '#EF5350',
  errorDark: '#B71C1C',

  warning: '#F9A825',
  warningLight: '#FBC02D',
  warningDark: '#E65100',

  info: '#1976D2',
  infoLight: '#42A5F5',
  infoDark: '#0D47A1',

  // Dark mode backgrounds
  darkBg: '#1C1C1E',
  darkSurface: '#2C2C2E',
  darkElevated: '#3A3A3C',
  darkBorder: '#38383A',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#EBEBF5',
  textTertiary: '#8E8E93',
  textDisabled: '#636366',
  textInverse: '#000000',

  // Overlay
  overlayLight: 'rgba(255, 255, 255, 0.1)',
  overlayMedium: 'rgba(0, 0, 0, 0.5)',
  overlayDark: 'rgba(0, 0, 0, 0.8)',
} as const;

export const Typography = {
  fontFamily: {
    regular: 'Inter-Regular',
    medium: 'Inter-Medium',
    semiBold: 'Inter-SemiBold',
    bold: 'Inter-Bold',
    mono: 'JetBrains-Mono',
  },
  fontSize: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 17,
    lg: 20,
    xl: 24,
    '2xl': 28,
    '3xl': 34,
    '4xl': 40,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
} as const;

export const BorderRadius = {
  sm: 6,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  primary: {
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
} as const;

export const theme = {
  colors: {
    primary: '#2563EB',
    secondary: '#3A506B',
    background: '#1C1C1E',
    surface: '#2C2C2E',
    card: '#2C2C2E',
    border: '#38383A',
    text: '#FFFFFF',
    textSecondary: '#EBEBF5',
    textMuted: '#8E8E93',
    success: '#2D8A4E',
    warning: '#F9A825',
    error: '#D32F2F',
    biometric: '#2563EB',
    skeleton: { base: '#1C1C1E', highlight: '#2C2C2E' },
    status: { active: '#2D8A4E', pending: '#F9A825', inactive: '#8E8E93', error: '#D32F2F' },
  },
  spacing: { xs: 4, sm: 8, md: 12, base: 16, lg: 20, xl: 24, xxl: 32 },
  radius: { sm: 6, md: 12, lg: 16, xl: 24, full: 9999 },
  typography: {
    fontSize: { xs: 11, sm: 13, base: 15, md: 17, lg: 20, xl: 24, '2xl': 28, '3xl': 34 },
    lineHeight: { tight: 1.2, normal: 1.5, relaxed: 1.75 },
    fontWeight: { normal: '400' as const, medium: '500' as const, semiBold: '600' as const, bold: '700' as const },
  },
  animation: { spring: { damping: 15, stiffness: 300, mass: 0.6 }, fast: 150, normal: 300, slow: 500 },
  elevation: {
    sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.3, shadowRadius: 2, elevation: 2 },
    md: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 6 },
    lg: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 16, elevation: 10 },
    primary: { shadowColor: '#2563EB', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
  },
} as const;
export type Theme = typeof theme;
