/**
 * Bảng màu đồng bộ với website (dark theme - black/blue/red gradient)
 * Nguồn: CSS variables :root / .dark từ website.
 */
export const WEBSITE_PALETTE = {
  primary: '#3b82f6',           // --primary (blue)
  primaryLight: '#60a5fa',      // blue-400
  primaryDark: '#2563eb',       // --accent
  secondary: '#1e293b',        // --secondary (slate)
  secondaryLight: '#334155',   // --switch-background
  secondaryDark: '#0f172a',    // slate-900
  background: '#0a0e1a',       // --background
  surface: '#131827',          // --card
  surfaceSecondary: '#1e293b', // --muted
  textPrimary: '#e4e7f1',      // --foreground
  textSecondary: '#94a3b8',    // --muted-foreground
  border: 'rgba(59, 130, 246, 0.2)',  // --border
  borderFocus: '#3b82f6',      // --ring
} as const;

export const COLORS = {
  primary: WEBSITE_PALETTE.primary,
  primaryLight: WEBSITE_PALETTE.primaryLight,
  primaryDark: WEBSITE_PALETTE.primaryDark,
  secondary: WEBSITE_PALETTE.secondary,
  secondaryLight: WEBSITE_PALETTE.secondaryLight,
  secondaryDark: WEBSITE_PALETTE.secondaryDark,

  success: '#10b981',          // --chart-4
  successLight: '#D1FAE5',
  warning: '#f59e0b',          // --chart-5
  warningLight: '#FEF3C7',
  error: '#ef4444',            // --destructive
  errorLight: '#FEE2E2',
  info: '#3b82f6',             // --primary
  infoLight: 'rgba(59, 130, 246, 0.15)',

  white: '#ffffff',
  black: '#0a0e1a',
  gray50: '#f8fafc',
  gray100: '#e4e7f1',
  gray200: '#94a3b8',
  gray300: '#64748b',
  gray400: '#94a3b8',
  gray500: '#64748b',
  gray600: '#475569',
  gray700: '#334155',
  gray800: '#1e293b',
  gray900: '#0f172a',

  background: WEBSITE_PALETTE.background,
  surface: WEBSITE_PALETTE.surface,
  surfaceSecondary: WEBSITE_PALETTE.surfaceSecondary,
  darkSurface: '#0f1419',      // --sidebar

  textPrimary: WEBSITE_PALETTE.textPrimary,
  textSecondary: WEBSITE_PALETTE.textSecondary,
  textDisabled: '#64748b',
  textInverse: '#ffffff',

  border: WEBSITE_PALETTE.border,
  borderFocus: WEBSITE_PALETTE.borderFocus,

  overlay: 'rgba(0, 0, 0, 0.65)',
  overlayLight: 'rgba(0, 0, 0, 0.25)',

  rating: WEBSITE_PALETTE.primary,
  tabActive: WEBSITE_PALETTE.primary,
  tabInactive: WEBSITE_PALETTE.textSecondary,
};

export type ColorKey = keyof typeof COLORS;
