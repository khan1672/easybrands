import { TextStyle } from 'react-native';

export const typography: Record<string, TextStyle> = {
  display: {
    fontSize: 34,
    lineHeight: 41,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  heading1: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  heading2: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '600',
  },
  heading3: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
  },
  bodySmall: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
  },
  button: {
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  buttonMicro: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  buttonSmall: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
};

/**
 * Font scaling that survives the OS accessibility setting.
 *
 * React Native scales `fontSize` on its own (`allowFontScaling`, on by default,
 * and what iOS Dynamic Type drives), but it leaves `lineHeight` exactly as
 * written. A user at the largest text size therefore gets 20pt glyphs on a
 * 20pt line box, which crops ascenders and descenders. So the line box has to
 * be scaled by the same factor the platform is already applying to the glyphs.
 *
 * `fontSize` is deliberately *not* touched here: it is scaled by the platform,
 * and scaling it again would multiply the setting twice.
 */
export const MAX_TEXT_SCALE = 3;

/**
 * The factor to scale line boxes and letter spacing by.
 *
 * Guarded against a missing or nonsensical value, because a `lineHeight` of
 * `NaN` silently breaks layout and a zero-height line box hides the text.
 */
export const resolveTextScale = (fontScale: number | undefined): number => {
  if (typeof fontScale !== 'number' || !Number.isFinite(fontScale) || fontScale <= 0) {
    return 1;
  }
  return Math.min(fontScale, MAX_TEXT_SCALE);
};

/** Applies the text scale to the parts of a type style the platform ignores. */
export const scaleTextStyle = (style: TextStyle, fontScale: number | undefined): TextStyle => {
  const scale = resolveTextScale(fontScale);
  if (scale === 1) {
    return style;
  }
  return {
    ...style,
    ...(style.lineHeight !== undefined ? { lineHeight: Math.round(style.lineHeight * scale) } : {}),
    ...(style.letterSpacing !== undefined
      ? { letterSpacing: style.letterSpacing * scale }
      : {}),
  };
};
