/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { Switch } from 'react-native';
import { FilterPanel } from '../src/features/categories/components/FilterPanel';
import { strings } from '../src/utils/strings';
import {
  DEFAULT_FILTERS,
  type CategoryFilters,
  type ProductFacets,
} from '../src/types/filters';

type Renderer = ReturnType<typeof ReactTestRenderer.create>;
type Instance = ReactTestRenderer.ReactTestInstance;
type Node = ReactTestRenderer.ReactTestRendererJSON | string | null;

const facets: ProductFacets = {
  brands: [
    { name: 'HSY', count: 42 },
    { name: 'Gul Ahmed', count: 17 },
  ],
  categories: [{ name: 'Ready to Wear', slug: 'ready-to-wear', count: 59 }],
  price: { min: 500, max: 295000 },
  total: 59,
};

const renderPanel = async (
  overrides: {
    draft?: Partial<CategoryFilters>;
    applied?: Partial<CategoryFilters>;
    facets?: ProductFacets | undefined;
  } = {}
): Promise<{ renderer: Renderer; onChangeDraft: jest.Mock }> => {
  const onChangeDraft = jest.fn();
  let renderer: Renderer | undefined;
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(
      <FilterPanel
        facets={overrides.facets === undefined ? facets : overrides.facets}
        facetsLoading={false}
        applied={{ ...DEFAULT_FILTERS, ...overrides.applied }}
        draft={{ ...DEFAULT_FILTERS, ...overrides.draft }}
        onChangeDraft={onChangeDraft}
        currency="PKR"
      />,
    );
  });
  if (!renderer) {
    throw new Error('FilterPanel did not render');
  }
  return { renderer, onChangeDraft };
};

const collectText = (node: Node | Node[]): string[] => {
  if (node === null || node === undefined) {
    return [];
  }
  if (typeof node === 'string') {
    return [node];
  }
  if (Array.isArray(node)) {
    return node.flatMap(collectText);
  }
  const own = typeof node.children === 'string' ? [node.children] : [];
  return [...own, ...(node.children ?? []).flatMap(collectText)];
};

const byLabel = (renderer: Renderer, label: string): Instance => {
  const match = renderer.root
    .findAll(node => typeof node.type !== 'string' && node.props?.accessibilityLabel === label)
    .filter(node => typeof node.props?.onPress === 'function' || typeof node.props?.onValueChange === 'function');
  if (match.length === 0) {
    throw new Error(`No interactive element labelled "${label}"`);
  }
  return match[0];
};

const byInputLabel = (renderer: Renderer, label: string): Instance => {
  const match = renderer.root.findAll(
    node => typeof node.type !== 'string' && node.props?.accessibilityLabel === label
  );
  if (match.length === 0) {
    throw new Error(`No input labelled "${label}"`);
  }
  return match[match.length - 1];
};

const textOf = (renderer: Renderer): string => collectText(renderer.toJSON()).join(' ');

describe('FilterPanel', () => {
  it('lists every facet brand with its count', async () => {
    const { renderer } = await renderPanel();
    const text = textOf(renderer);
    expect(text).toContain('HSY');
    expect(text).toContain('42');
    expect(text).toContain('Gul Ahmed');
    expect(text).toContain('17');
  });

  it('adds a brand to the draft when its row is pressed', async () => {
    const { renderer, onChangeDraft } = await renderPanel();
    await ReactTestRenderer.act(async () => {
      byLabel(renderer, `HSY, 42 ${strings.productCountLabel}`).props.onPress();
    });
    expect(onChangeDraft).toHaveBeenCalledWith(
      expect.objectContaining({ brands: ['HSY'] }),
    );
  });

  it('removes a brand that is already selected', async () => {
    const { renderer, onChangeDraft } = await renderPanel({
      draft: { brands: ['HSY', 'Gul Ahmed'] },
    });
    await ReactTestRenderer.act(async () => {
      byLabel(renderer, `HSY, 42 ${strings.productCountLabel}`).props.onPress();
    });
    expect(onChangeDraft).toHaveBeenCalledWith(
      expect.objectContaining({ brands: ['Gul Ahmed'] }),
    );
  });

  it('selects a sort option', async () => {
    const { renderer, onChangeDraft } = await renderPanel();
    await ReactTestRenderer.act(async () => {
      byLabel(renderer, strings.sortPriceDesc).props.onPress();
    });
    expect(onChangeDraft).toHaveBeenCalledWith(expect.objectContaining({ sort: 'price_desc' }));
  });

  it('shows the category price range as a hint', async () => {
    const { renderer } = await renderPanel();
    expect(textOf(renderer)).toMatch(/500.*295,000/s);
  });

  describe('price validation', () => {
    it('commits a valid range on blur', async () => {
      const { renderer, onChangeDraft } = await renderPanel();
      // Typing and blurring are separate events, so each gets its own act() to
      // let the controlled inputs re-render before blur reads their state.
      await ReactTestRenderer.act(async () => {
        byInputLabel(renderer, strings.filterMinPriceA11y).props.onChangeText('20000');
        byInputLabel(renderer, strings.filterMaxPriceA11y).props.onChangeText('60000');
      });
      await ReactTestRenderer.act(async () => {
        byInputLabel(renderer, strings.filterMinPriceA11y).props.onBlur();
      });
      expect(onChangeDraft).toHaveBeenCalledWith(
        expect.objectContaining({ minPrice: 20000, maxPrice: 60000 }),
      );
    });

    it('swaps a reversed range instead of returning nothing', async () => {
      const { renderer, onChangeDraft } = await renderPanel();
      await ReactTestRenderer.act(async () => {
        byInputLabel(renderer, strings.filterMinPriceA11y).props.onChangeText('60000');
        byInputLabel(renderer, strings.filterMaxPriceA11y).props.onChangeText('20000');
      });
      await ReactTestRenderer.act(async () => {
        byInputLabel(renderer, strings.filterMinPriceA11y).props.onBlur();
      });
      expect(onChangeDraft).toHaveBeenCalledWith(
        expect.objectContaining({ minPrice: 20000, maxPrice: 60000 }),
      );
      expect(textOf(renderer)).toContain(strings.filterPriceSwapped);
    });

    it('shows an inline error and commits nothing for a non-numeric price', async () => {
      const { renderer, onChangeDraft } = await renderPanel();
      const min = byInputLabel(renderer, strings.filterMinPriceA11y);
      await ReactTestRenderer.act(async () => {
        min.props.onChangeText('abc');
        min.props.onBlur();
      });
      expect(textOf(renderer)).toContain(strings.filterInvalidPrice);
      expect(onChangeDraft).not.toHaveBeenCalled();
    });
  });

  it('does not offer an availability toggle', async () => {
    // Out-of-stock products are excluded unconditionally; re-exposing a switch
    // would list items that cannot be added to a bag.
    const { renderer } = await renderPanel();
    expect(renderer.root.findAllByType(Switch)).toHaveLength(0);
  });

  it('falls back to a message when facets are unavailable', async () => {
    const { renderer } = await renderPanel({ facets: { brands: [], categories: [], price: { min: 0, max: 0 }, total: 0 } });
    expect(textOf(renderer)).toContain(strings.filterBrandsUnavailable);
  });
});
