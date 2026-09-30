/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

// Mutable so a test can pin the OS text size. Named with the `mock` prefix so
// the hoisted factory below is allowed to close over it.
let mockFontScale = 1;

// The hook is mocked at its own module rather than by spreading `react-native`:
// spreading the barrel evaluates its lazy getters, which reach for TurboModules
// that do not exist under Jest.
jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({
  __esModule: true,
  default: () => ({ width: 390, height: 844, scale: 3, fontScale: mockFontScale }),
}));

import { MAX_TEXT_SCALE, resolveTextScale, scaleTextStyle, typography } from '../src/theme/typography';
import { AppText, type AppTextVariant } from '../src/components/ui/AppText';

type Renderer = ReturnType<typeof ReactTestRenderer.create>;

const setFontScale = (fontScale: number): void => {
  mockFontScale = fontScale;
};

const renderText = async (props: React.ComponentProps<typeof AppText>): Promise<Renderer> => {
  let renderer: Renderer | undefined;
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(<AppText {...props} />);
  });
  if (!renderer) {
    throw new Error('AppText did not render');
  }
  return renderer;
};

/** The style array React Native receives, flattened to plain objects. */
const textStyleOf = (renderer: Renderer): Record<string, number>[] => {
  const text = renderer.root.findByType('Text' as never);
  const style = text.props.style as unknown;
  return (Array.isArray(style) ? style : [style]) as Record<string, number>[];
};

describe('resolveTextScale', () => {
  it('uses the OS setting when it is a usable number', () => {
    expect(resolveTextScale(1)).toBe(1);
    expect(resolveTextScale(1.3)).toBe(1.3);
    expect(resolveTextScale(2.5)).toBe(2.5);
  });

  it('falls back to 1 for a missing or nonsensical value', () => {
    // A NaN lineHeight silently collapses the text, which is worse than
    // ignoring the preference.
    expect(resolveTextScale(undefined)).toBe(1);
    expect(resolveTextScale(Number.NaN)).toBe(1);
    expect(resolveTextScale(0)).toBe(1);
    expect(resolveTextScale(-2)).toBe(1);
  });

  it('caps at the accessibility maximum', () => {
    // Past the platform's own ceiling the layout cannot absorb it, and an
    // uncapped value produces an unreadable wall of text.
    expect(resolveTextScale(99)).toBe(MAX_TEXT_SCALE);
  });
});

describe('scaleTextStyle', () => {
  const base = { fontSize: 14, lineHeight: 20, letterSpacing: 0.3 };

  it('returns the style untouched at the default text size', () => {
    expect(scaleTextStyle(base, 1)).toBe(base);
  });

  it('scales the line box by the same factor as the glyphs', () => {
    // React Native scales fontSize itself but never lineHeight, so without this
    // a 2x text size puts 28pt glyphs on a 20pt line and crops them.
    const scaled = scaleTextStyle(base, 2);
    expect(scaled.fontSize).toBe(14);
    expect(scaled.lineHeight).toBe(40);
    expect(scaled.letterSpacing).toBeCloseTo(0.6);
  });

  it('leaves fontSize alone so the setting is not applied twice', () => {
    for (const variant of Object.keys(typography)) {
      const original = typography[variant].fontSize;
      expect(scaleTextStyle(typography[variant], 2).fontSize).toBe(original);
    }
  });

  it('keeps every variant line box taller than its glyphs once scaled', () => {
    for (const variant of Object.keys(typography)) {
      const style = typography[variant];
      if (style.lineHeight === undefined || style.fontSize === undefined) {
        continue;
      }
      const scaled = scaleTextStyle(style, 1.6);
      expect(scaled.lineHeight).toBeGreaterThanOrEqual((scaled.fontSize ?? 0) * 1.1);
    }
  });

  it('handles a style with no line height', () => {
    const scaled = scaleTextStyle({ fontSize: 12 }, 2);
    expect(scaled.lineHeight).toBeUndefined();
  });

  it('scales a style that has no letter spacing without inventing one', () => {
    const scaled = scaleTextStyle({ fontSize: 12, lineHeight: 16 }, 2);
    expect(scaled.letterSpacing).toBeUndefined();
    expect(scaled.lineHeight).toBe(32);
  });
});

describe('AppText', () => {
  beforeEach(() => {
    setFontScale(1);
  });

  it('grows the line box with the OS text size', async () => {
    // The real bug this prevents: at a 2x text size the platform doubles the
    // glyphs but left the 20pt line box alone, cropping every label.
    const normal = await renderText({ variant: 'bodySmall', children: 'Ready to Wear' });
    const [atOne] = textStyleOf(normal);
    await ReactTestRenderer.act(async () => {
      normal.unmount();
    });

    setFontScale(2);
    const large = await renderText({ variant: 'bodySmall', children: 'Ready to Wear' });
    const [atTwo] = textStyleOf(large);

    expect(atOne.lineHeight).toBe(typography.bodySmall.lineHeight);
    expect(atTwo.lineHeight).toBe((typography.bodySmall.lineHeight ?? 0) * 2);
    // fontSize is the platform's job; scaling it here would double-apply.
    expect(atTwo.fontSize).toBe(typography.bodySmall.fontSize);
  });

  it('leaves font scaling to the platform for the glyphs', async () => {
    // It has to stay on: on iOS this is what drives Dynamic Type, and turning
    // it off would ignore the user's text size entirely.
    const renderer = await renderText({ children: 'Limelight' });
    const text = renderer.root.findByType('Text' as never);
    expect(text.props.allowFontScaling).toBe(true);
  });

  it('applies the variant type style with a defined line box', async () => {
    const renderer = await renderText({ variant: 'bodySmall', children: 'Ready to Wear' });
    const [type] = textStyleOf(renderer);
    expect(type.fontSize).toBe(typography.bodySmall.fontSize);
    expect(type.lineHeight).toBe(typography.bodySmall.lineHeight);
  });

  it('renders every variant without losing its line box', async () => {
    setFontScale(1.5);
    for (const variant of Object.keys(typography) as AppTextVariant[]) {
      const renderer = await renderText({ variant, children: 'Sample' });
      const [type] = textStyleOf(renderer);
      expect(type.lineHeight).toBeGreaterThan(0);
      await ReactTestRenderer.act(async () => {
        renderer.unmount();
      });
    }
  });
});
