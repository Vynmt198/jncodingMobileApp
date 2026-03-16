import { Platform } from 'react-native';

export const SPACING = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
} as const;

/** Đồng bộ website: --radius 0.75rem (12px) → lg; --radius-sm/md/lg/xl */
export const BORDER_RADIUS = {
  none: 0,
  sm: 8,   // calc(0.75rem - 4px)
  md: 10,  // calc(0.75rem - 2px)
  lg: 12,  // --radius 0.75rem (rounded-lg)
  xl: 16,  // calc(0.75rem + 4px)
  '2xl': 20,
  '3xl': 24,
  full: 9999,
} as const;

export const SHADOW = {
  sm: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
      web: {
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
      },
    }),
  },
  md: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
      },
    }),
  },
  lg: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 4px 8px rgba(0,0,0,0.12)',
      },
    }),
  },
  xl: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.16,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 8px 16px rgba(0,0,0,0.16)',
      },
    }),
  },
} as const;
