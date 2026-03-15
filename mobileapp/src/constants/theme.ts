import { COLORS } from './colors';
import { FONT_SIZE, FONT_WEIGHT, TYPOGRAPHY } from './typography';
import { SPACING, BORDER_RADIUS, SHADOW } from './spacing';

export const theme = {
  colors: COLORS,
  fontSize: FONT_SIZE,
  fontWeight: FONT_WEIGHT,
  typography: TYPOGRAPHY,
  spacing: SPACING,
  borderRadius: BORDER_RADIUS,
  shadow: SHADOW,
};

export type Theme = typeof theme;

export { COLORS, FONT_SIZE, FONT_WEIGHT, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOW };
