export const COLORS = {
  // Primary palette (Deep Navy Luxury)
  primary: '#0B132B',      // Midnight Navy
  primaryLight: '#1C2541', // Soft Navy
  primaryDark: '#050A1A',  // Super Dark

  // Secondary palette (Champagne & Gold Accents)
  secondary: '#D4AF37',    // Classic Gold
  secondaryLight: '#F7E7CE', // Champagne
  secondaryDark: '#AA8C2C',  // Deep Gold

  // Semantic colors
  success: '#10B981',
  successLight: '#D1FAE5',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  info: '#3B82F6',
  infoLight: '#DBEAFE',

  // Neutral scale (Slightly warmer off-whites for luxury feel)
  white: '#FFFFFF',
  black: '#0A0A0A',
  gray50: '#FAFAFA',       // Luxurious Off-white
  gray100: '#F4F4F5',
  gray200: '#E4E4E7',
  gray300: '#D4D4D8',
  gray400: '#A1A1AA',
  gray500: '#71717A',
  gray600: '#52525B',
  gray700: '#3F3F46',
  gray800: '#27272A',
  gray900: '#18181B',

  // Background
  background: '#FAFAFA',
  surface: '#FFFFFF',
  surfaceSecondary: '#F4F4F5',
  darkSurface: '#121212',

  // Text
  textPrimary: '#18181B',
  textSecondary: '#52525B',
  textDisabled: '#A1A1AA',
  textInverse: '#FFFFFF',

  // Border
  border: '#E4E4E7',
  borderFocus: '#D4AF37',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.65)',
  overlayLight: 'rgba(0, 0, 0, 0.25)',

  // Rating
  rating: '#D4AF37', // Gold stars

  // Tab bar
  tabActive: '#D4AF37', // Gold active tabs
  tabInactive: '#A1A1AA',
};

export type ColorKey = keyof typeof COLORS;
