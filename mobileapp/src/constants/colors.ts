export const COLORS = {
  // Primary palette
  primary: '#4F46E5',      // Indigo
  primaryLight: '#818CF8',
  primaryDark: '#3730A3',

  // Secondary palette
  secondary: '#EC4899',    // Pink
  secondaryLight: '#F9A8D4',
  secondaryDark: '#BE185D',

  // Semantic colors
  success: '#10B981',
  successLight: '#D1FAE5',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  info: '#3B82F6',
  infoLight: '#DBEAFE',

  // Neutral scale
  white: '#FFFFFF',
  black: '#000000',
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray300: '#D1D5DB',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray600: '#4B5563',
  gray700: '#374151',
  gray800: '#1F2937',
  gray900: '#111827',

  // Background
  background: '#F9FAFB',
  surface: '#FFFFFF',
  surfaceSecondary: '#F3F4F6',

  // Text
  textPrimary: '#111827',
  textSecondary: '#4B5563',
  textDisabled: '#9CA3AF',
  textInverse: '#FFFFFF',

  // Border
  border: '#E5E7EB',
  borderFocus: '#4F46E5',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',

  // Rating
  rating: '#F59E0B',

  // Tab bar
  tabActive: '#4F46E5',
  tabInactive: '#9CA3AF',
};

export type ColorKey = keyof typeof COLORS;
