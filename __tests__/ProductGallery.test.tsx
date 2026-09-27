/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';
import { ProductGallery } from '../src/features/products/components/ProductGallery';
import { strings } from '../src/utils/strings';
import type { ProductImage } from '../src/types/product';

type Renderer = ReturnType<typeof ReactTestRenderer.create>;
type Node = ReactTestRenderer.ReactTestRendererJSON | string | null;

const images: ProductImage[] = [
  { url: 'https://cdn.test/a.jpg', alt: 'Front view' },
  { url: 'https://cdn.test/b.jpg', alt: 'Back view' },
];

/** Fixed metrics so the viewer's useSafeAreaInsets() has a value. */
const metrics: Metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

const collectText = (node: Node | Node[]): string[] => {
  if (node === null || node === undefined) return [];
  if (typeof node === 'string') return [node];
  if (Array.isArray(node)) return node.flatMap(collectText);
  const own = typeof node.children === 'string' ? [node.children] : [];
  return [...own, ...(node.children ?? []).flatMap(collectText)];
};

const render = async (): Promise<Renderer> => {
  let renderer: Renderer | undefined;
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(
      <SafeAreaProvider initialMetrics={metrics}>
        <ProductGallery images={images} productName="Tights" />
      </SafeAreaProvider>,
    );
  });
  if (!renderer) throw new Error('ProductGallery did not render');
  return renderer;
};

const byLabel = (renderer: Renderer, label: string) =>
  renderer.root.findAll(
    node => typeof node.props?.onPress === 'function' && node.props?.accessibilityLabel === label,
  );

describe('ProductGallery full-screen viewer', () => {
  it('tells assistive tech that the photo can be opened full screen', async () => {
    const renderer = await render();
    const [open] = byLabel(renderer, `Front view. ${strings.productImageFullScreen}`);
    expect(open).toBeDefined();
  });

  it('opens the zoomable viewer when a photo is tapped', async () => {
    const renderer = await render();
    expect(collectText(renderer.toJSON())).not.toContain(strings.productZoomHint);

    const [open] = byLabel(renderer, `Front view. ${strings.productImageFullScreen}`);
    await ReactTestRenderer.act(async () => {
      open.props.onPress();
    });

    // The viewer is where the zoom affordance is explained, so its presence
    // proves the full-screen path opened rather than just re-rendering the card.
    expect(collectText(renderer.toJSON())).toContain(strings.productZoomHint);
  });

  it('keeps a close control in the viewer', async () => {
    const renderer = await render();
    const [open] = byLabel(renderer, `Front view. ${strings.productImageFullScreen}`);
    await ReactTestRenderer.act(async () => {
      open.props.onPress();
    });
    expect(byLabel(renderer, strings.filterClose).length).toBeGreaterThan(0);
  });

  /**
   * Regression guard: the viewer used to pan the image vertically and drag it
   * away to dismiss, which felt like the viewer was fighting the shopper.
   * Zooming must change the size and nothing else.
   */
  it('zooms in place, without translating the image vertically', async () => {
    const renderer = await render();
    const [open] = byLabel(renderer, `Front view. ${strings.productImageFullScreen}`);
    await ReactTestRenderer.act(async () => {
      open.props.onPress();
    });

    const transforms = renderer.root
      .findAll(node => {
        const flat = StyleSheet.flatten(node.props?.style) ?? {};
        return Array.isArray((flat as { transform?: unknown }).transform);
      })
      .map(node => ((StyleSheet.flatten(node.props.style) as { transform: object[] }).transform));

    expect(transforms.length).toBeGreaterThan(0);
    for (const transform of transforms) {
      const keys = transform.map(entry => Object.keys(entry)[0]);
      expect(keys).not.toContain('translateY');
      expect(keys).toContain('scale');
    }
  });

  it('shows the position of the photo in a multi-image gallery', async () => {
    const renderer = await render();
    expect(collectText(renderer.toJSON()).join(' ')).toContain('1 / 2');
  });

  it('renders a placeholder instead of a broken viewer when a product has no photos', async () => {
    let renderer: Renderer | undefined;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <SafeAreaProvider initialMetrics={metrics}>
          <ProductGallery images={[]} productName="Tights" />
        </SafeAreaProvider>,
      );
    });
    const text = collectText(renderer!.toJSON());
    expect(text).toContain(strings.productNoImages);
    expect(text).not.toContain(strings.productZoomHint);
  });
});
