/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { StyleSheet } from 'react-native';
import { BrandCategoryRail } from '../src/features/brands/components/BrandCategoryRail';
import { strings } from '../src/utils/strings';
import { dimensions } from '../src/theme/dimensions';
import type { FacetCategory } from '../src/types/filters';

type Renderer = ReturnType<typeof ReactTestRenderer.create>;
type Node = ReactTestRenderer.ReactTestRendererJSON | ReactTestRenderer.ReactTestRendererNode | null;

const categories: FacetCategory[] = [
  { name: 'Accessories', slug: 'accessories', count: 184 },
  { name: 'Ready to Wear', slug: 'ready-to-wear', count: 152 },
  { name: 'Unstitched', slug: 'unstitched', count: 88 },
];

const renderRail = async (
  props: Partial<React.ComponentProps<typeof BrandCategoryRail>> = {}
): Promise<{ renderer: Renderer; onSelect: jest.Mock }> => {
  const onSelect = jest.fn();
  let renderer: Renderer | undefined;
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(
      <BrandCategoryRail
        categories={props.categories ?? categories}
        selected={props.selected}
        onSelect={onSelect}
      />,
    );
  });
  if (!renderer) {
    throw new Error('BrandCategoryRail did not render');
  }
  return { renderer, onSelect };
};

// A Pressable also produces a host View that carries the same accessibility
// props, so match on the node that actually owns the press handler.
const flattenChipStyle = (
  chip: ReactTestRenderer.ReactTestInstance,
): Record<string, number> => {
  const raw = chip.props.style;
  return StyleSheet.flatten(typeof raw === 'function' ? raw({ pressed: false }) : raw) as Record<
    string,
    number
  >;
};

const tabs = (renderer: Renderer): ReactTestRenderer.ReactTestInstance[] =>
  renderer.root.findAll(
    (node) =>
      node.props.accessibilityRole === 'tab' && typeof node.props.onPress === 'function',
  );

const press = async (renderer: Renderer, index: number): Promise<void> => {
  const target = tabs(renderer)[index];
  if (!target) {
    throw new Error(`no tab at index ${index}`);
  }
  await ReactTestRenderer.act(async () => {
    target.props.onPress();
  });
};

const tabLabels = (renderer: Renderer): (string | undefined)[] =>
  tabs(renderer).map((node) => node.props.accessibilityLabel as string | undefined);

const selectedFlags = (renderer: Renderer): (boolean | undefined)[] =>
  tabs(renderer).map((node) => node.props.accessibilityState?.selected as boolean | undefined);

const textOf = (node: Node | Node[]): string => {
  if (node === null || node === undefined) {
    return '';
  }
  if (typeof node === 'string') {
    return node;
  }
  if (Array.isArray(node)) {
    return node.map(textOf).join(' ');
  }
  return textOf(node.children);
};

describe('BrandCategoryRail', () => {
  it('renders an All chip followed by every category', async () => {
    const { renderer } = await renderRail();
    const labels = tabLabels(renderer);
    expect(labels).toHaveLength(categories.length + 1);
    expect(labels[0]).toBe(strings.brandCategoryAll);
    expect(labels.slice(1)).toEqual(categories.map((c) => strings.brandCategoryLabel(c.name, c.count)));
  });

  it('shows the product count next to each category', async () => {
    const { renderer } = await renderRail();
    const text = textOf(renderer.toJSON());
    expect(text).toContain('Ready to Wear');
    expect(text).toContain('152');
  });

  it('marks All as selected when no category is chosen', async () => {
    const { renderer } = await renderRail();
    expect(selectedFlags(renderer)).toEqual([true, false, false, false]);
  });

  it('marks the chosen category as selected', async () => {
    // Selection cannot rely on colour alone, so it is exposed to screen
    // readers through accessibilityState.
    const { renderer } = await renderRail({ selected: 'Ready to Wear' });
    expect(selectedFlags(renderer)).toEqual([false, false, true, false]);
  });

  it('reports the tapped category by its canonical name', async () => {
    const { renderer, onSelect } = await renderRail();
    // Index 0 is All, so the chips follow the categories in order.
    await press(renderer, 2);
    expect(onSelect).toHaveBeenCalledWith('Ready to Wear');
  });

  it('returns to every category when the selected chip is tapped again', async () => {
    const { renderer, onSelect } = await renderRail({ selected: 'Unstitched' });
    await press(renderer, 3);
    expect(onSelect).toHaveBeenCalledWith(undefined);
  });

  it('clears the category when All is tapped', async () => {
    const { renderer, onSelect } = await renderRail({ selected: 'Accessories' });
    await press(renderer, 0);
    expect(onSelect).toHaveBeenCalledWith(undefined);
  });

  it('keeps a 44pt tap area even though the chip is drawn shorter', async () => {
    // The chip height is a visual choice; the touch target is not. If someone
    // later trims the height again, this catches the lost tap area.
    const { renderer } = await renderRail();
    const chip = tabs(renderer)[1];
    const style = flattenChipStyle(chip);
    const hitSlop = chip.props.hitSlop as { top: number; bottom: number };
    const tapHeight = style.minHeight + hitSlop.top + hitSlop.bottom;
    expect(style.minHeight).toBe(dimensions.filterChipHeight);
    expect(tapHeight).toBeGreaterThanOrEqual(dimensions.minTouchTarget);
  });

  it('can grow instead of cropping the label at a large OS text size', async () => {
    // A fixed height would clip the label once the platform scales the text, so
    // the chip is sized with minHeight and only ever grows.
    const { renderer } = await renderRail();
    const style = flattenChipStyle(tabs(renderer)[1]);
    expect(style.height).toBeUndefined();
    expect(style.minHeight).toBeDefined();
  });

  it('renders nothing when the brand has no categories', async () => {
    const { renderer } = await renderRail({ categories: [] });
    expect(tabLabels(renderer)).toHaveLength(0);
  });

  it('renders nothing when every product is in the same category', async () => {
    // HSY and Sana Safinaz are entirely uncategorised, so they have a single
    // bucket: "All" beside it would be a chip that changes nothing.
    const { renderer } = await renderRail({
      categories: [{ name: 'Others', slug: 'others', count: 270 }],
    });
    expect(tabLabels(renderer)).toHaveLength(0);
  });
});
