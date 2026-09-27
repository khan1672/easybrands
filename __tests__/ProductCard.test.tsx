/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { Image } from 'react-native';
import { ProductCard } from '../src/components/product/ProductCard';
import { Product } from '../src/types/product';
import { strings } from '../src/utils/strings';

type Renderer = ReturnType<typeof ReactTestRenderer.create>;
type RenderedNode = ReactTestRenderer.ReactTestRendererJSON | string | null;

const baseProduct: Product = {
  id: 'p1',
  name: 'Cotton Fitted Shirt',
  brandName: 'HSY',
  slug: 'cotton-fitted-shirt',
  price: 2450,
  currency: 'PKR',
  categoryId: 'c1',
  images: [{ url: 'https://cdn.example.com/shirt.jpg', alt: 'Blue cotton shirt on model' }],
  colors: ['Blue'],
  rating: 4.5,
  reviewCount: 24,
  isNew: false,
};

const renderCard = async (product: Product): Promise<Renderer> => {
  let renderer: Renderer | undefined;
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(<ProductCard product={product} onPress={() => {}} />);
  });
  if (!renderer) {
    throw new Error('ProductCard did not render');
  }
  return renderer;
};

const collectText = (node: RenderedNode | RenderedNode[]): string[] => {
  if (node === null || node === undefined) {
    return [];
  }
  if (typeof node === 'string') {
    return [node];
  }
  if (Array.isArray(node)) {
    return node.flatMap(collectText);
  }
  return (node.children ?? []).flatMap(collectText);
};

describe('ProductCard images', () => {
  it('renders the primary image when one exists', async () => {
    const renderer = await renderCard(baseProduct);

    const images = renderer.root.findAllByType(Image);
    expect(images).toHaveLength(1);
    expect(images[0].props.source).toEqual({ uri: 'https://cdn.example.com/shirt.jpg' });
  });

  // 65 of the 5,475 scraped products have no imagery at all. Reading
  // `product.images[0].url` on those threw "undefined is not an object".
  it('renders without crashing when the product has no images', async () => {
    const renderer = await renderCard({ ...baseProduct, images: [] });

    expect(renderer.root.findAllByType(Image)).toHaveLength(0);
  });

  it('skips image entries whose url is blank', async () => {
    const renderer = await renderCard({
      ...baseProduct,
      images: [
        { url: '   ', alt: 'blank' },
        { url: 'https://cdn.example.com/real.jpg', alt: 'Real photo' },
      ],
    });

    const images = renderer.root.findAllByType(Image);
    expect(images).toHaveLength(1);
    expect(images[0].props.source).toEqual({ uri: 'https://cdn.example.com/real.jpg' });
  });
});

describe('ProductCard brand', () => {
  const textOf = (renderer: Renderer): string =>
    collectText(renderer.toJSON() as RenderedNode | RenderedNode[]).join(' ');

  // Brands sell near-identical product names, so the card has to say which
  // brand it is.
  it('shows the brand name above the product name', async () => {
    const renderer = await renderCard({ ...baseProduct, brandName: 'Gul Ahmed' });
    const text = textOf(renderer);

    expect(text).toContain('Gul Ahmed');
  });

  it('includes the brand in the accessibility label', async () => {
    const renderer = await renderCard({ ...baseProduct, brandName: 'Maria B' });
    const button = renderer.root.findAll(node => node.props?.accessibilityRole === 'button')[0];

    expect(button.props.accessibilityLabel).toContain('Maria B');
    expect(button.props.accessibilityLabel).toContain('Cotton Fitted Shirt');
  });

  it('omits the brand row when the source document had no brand', async () => {
    const renderer = await renderCard({ ...baseProduct, brandName: '' });
    const text = textOf(renderer);

    expect(text).not.toContain('HSY');
    expect(text).toContain('Cotton Fitted Shirt');
  });
});

describe('ProductCard ratings', () => {
  // Every scraped document has no rating, so the card used to render a
  // meaningless "0.0 (0)" under every product.
  it('does not render a rating or review count', async () => {
    const renderer = await renderCard({ ...baseProduct, rating: 4.8, reviewCount: 120 });
    const text = collectText(renderer.toJSON() as RenderedNode | RenderedNode[]).join(' ');

    expect(text).not.toContain(strings.ratingSymbol);
    expect(text).not.toContain('4.8');
    expect(text).not.toContain('120');
  });
});

describe('ProductCard pricing', () => {
  it('formats a known price with its currency', async () => {
    const renderer = await renderCard(baseProduct);
    const text = collectText(renderer.toJSON() as RenderedNode | RenderedNode[]).join(' ');

    expect(text).toContain('2,450');
    expect(text).not.toContain(strings.priceUnavailable);
  });

  // Merchant data on the storefront reports 0.00, so a 0 price is real data
  // rather than a loading state and must not be rendered as "Rs 0".
  it('shows "Price on request" and hides the discount for a zero price', async () => {
    const renderer = await renderCard({
      ...baseProduct,
      price: 0,
      compareAtPrice: 3200,
    });
    const text = collectText(renderer.toJSON() as RenderedNode | RenderedNode[]).join(' ');

    expect(text).toContain(strings.priceUnavailable);
    expect(text).not.toContain('%');
    expect(text).not.toContain('3,200');
  });
});
