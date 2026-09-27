/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { SizeSelector } from '../src/features/products/components/SizeSelector';
import { strings } from '../src/utils/strings';
import type { ProductVariant } from '../src/types/product';

type Renderer = ReturnType<typeof ReactTestRenderer.create>;
type Node = ReactTestRenderer.ReactTestRendererJSON | string | null;

const variants: ProductVariant[] = [
  { title: 'X-Small', sku: 'sku-xs', price: 500, available: false },
  { title: 'Small', sku: 'sku-s', price: 500, available: true },
  { title: 'Medium', sku: 'sku-m', price: 500, available: false },
];

const render = async (overrides: Partial<React.ComponentProps<typeof SizeSelector>> = {}): Promise<Renderer> => {
  const onSelect = jest.fn();
  let renderer: Renderer | undefined;
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(
      <SizeSelector
        variants={variants}
        selectedSku={overrides.selectedSku ?? null}
        onSelect={overrides.onSelect ?? onSelect}
      />,
    );
  });
  if (!renderer) {
    throw new Error('SizeSelector did not render');
  }
  return renderer;
};

const collectText = (node: Node | Node[]): string[] => {
  if (node === null || node === undefined) return [];
  if (typeof node === 'string') return [node];
  if (Array.isArray(node)) return node.flatMap(collectText);
  const own = typeof node.children === 'string' ? [node.children] : [];
  return [...own, ...(node.children ?? []).flatMap(collectText)];
};

/**
 * Pressable forwards accessibilityRole to its host View, so both instances
 * match; keep only the ones that actually carry a press handler.
 */
const sizeButtons = (renderer: Renderer) =>
  renderer.root.findAll(
    node =>
      node.props?.accessibilityRole === 'radio' && typeof node.props?.onPress === 'function',
  );

describe('SizeSelector', () => {
  it('renders every size as its own visible button', async () => {
    const renderer = await render();
    expect(sizeButtons(renderer)).toHaveLength(3);
    const text = collectText(renderer.toJSON()).join(' ');
    expect(text).toContain('X-Small');
    expect(text).toContain('Small');
    expect(text).toContain('Medium');
  });

  // A hidden list would make a shopper open a menu to learn whether their size
  // exists at all.
  it('keeps unavailable sizes visible but disabled', async () => {
    const renderer = await render();
    const buttons = sizeButtons(renderer);
    const xs = buttons[0];

    expect(xs.props.accessibilityState.disabled).toBe(true);
    expect(collectText(renderer.toJSON()).join(' ')).toContain('X-Small');
  });

  it('marks the selected size for assistive tech', async () => {
    const renderer = await render({ selectedSku: 'sku-s' });
    const selected = sizeButtons(renderer).filter(b => b.props.accessibilityState.selected);
    expect(selected).toHaveLength(1);
  });

  it('reports the tapped size', async () => {
    const onSelect = jest.fn();
    const renderer = await render({ onSelect });
    const small = sizeButtons(renderer)[1];
    await ReactTestRenderer.act(async () => {
      small.props.onPress();
    });
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ title: 'Small', sku: 'sku-s' }));
  });

  it('announces an unavailable size rather than reading it as available', async () => {
    const renderer = await render();
    expect(sizeButtons(renderer)[0].props.accessibilityLabel).toContain(
      strings.productSizeUnavailable,
    );
  });

  it('renders nothing when the product has no sizes', async () => {
    let renderer: Renderer | undefined;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <SizeSelector variants={[]} selectedSku={null} onSelect={jest.fn()} />,
      );
    });
    expect(collectText(renderer!.toJSON())).toHaveLength(0);
  });
});
