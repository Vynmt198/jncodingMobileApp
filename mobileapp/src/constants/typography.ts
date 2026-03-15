import { Platform } from 'react-native';

export const FONTS = {
  regular: Platform.select({
    ios: 'System',
    android: 'Roboto',
    default: 'System',
  }),
  medium: Platform.select({
    ios: 'System',
    android: 'Roboto-Medium',
    default: 'System',
  }),
  bold: Platform.select({
    ios: 'System',
    android: 'Roboto-Bold',
    default: 'System',
  }),
};

export const FONT_SIZE = {
  xs: 10,
  sm: 12,
  md: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  '4xl': 32,
  '5xl': 40,
};

export const FONT_WEIGHT: Record<string, '400' | '500' | '600' | '700' | '800'> = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
};

export const LINE_HEIGHT = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.75,
};

export const TYPOGRAPHY = {
  h1: { fontSize: FONT_SIZE['4xl'], fontWeight: FONT_WEIGHT.bold, lineHeight: FONT_SIZE['4xl'] * LINE_HEIGHT.tight, letterSpacing: -0.5 },
  h2: { fontSize: FONT_SIZE['3xl'], fontWeight: FONT_WEIGHT.bold, lineHeight: FONT_SIZE['3xl'] * LINE_HEIGHT.tight, letterSpacing: -0.5 },
  h3: { fontSize: FONT_SIZE['2xl'], fontWeight: FONT_WEIGHT.semibold, lineHeight: FONT_SIZE['2xl'] * LINE_HEIGHT.tight, letterSpacing: -0.3 },
  h4: { fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.semibold, lineHeight: FONT_SIZE.xl * LINE_HEIGHT.normal, letterSpacing: -0.2 },
  h5: { fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.semibold, lineHeight: FONT_SIZE.lg * LINE_HEIGHT.normal, letterSpacing: -0.1 },
  bodyLarge: { fontSize: FONT_SIZE.base, fontWeight: FONT_WEIGHT.regular, lineHeight: FONT_SIZE.base * LINE_HEIGHT.relaxed, letterSpacing: 0.1 },
  bodyMedium: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.regular, lineHeight: FONT_SIZE.md * LINE_HEIGHT.relaxed, letterSpacing: 0.1 },
  bodySmall: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.regular, lineHeight: FONT_SIZE.sm * LINE_HEIGHT.relaxed, letterSpacing: 0.2 },
  caption: { fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.regular, lineHeight: FONT_SIZE.xs * LINE_HEIGHT.normal, letterSpacing: 0.3 },
  label: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.medium, lineHeight: FONT_SIZE.sm * LINE_HEIGHT.normal, letterSpacing: 0.1 },
  button: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.semibold, lineHeight: FONT_SIZE.md * LINE_HEIGHT.normal, letterSpacing: 0.5 },
};
