/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { browseProductPage, getProductFacets } from '../src/services/api/productApi';
import {
  useBrandFacets,
  useBrandProducts,
} from '../src/features/brands/queries/useBrandProducts';

jest.mock('../src/services/api/productApi', () => ({
  browseProductPage: jest.fn(async () => ({ items: [], total: 0, page: 1, limit: 20 })),
  getProductFacets: jest.fn(async () => ({
    brands: [],
    categories: [],
    price: { min: 0, max: 0 },
    total: 0,
  })),
}));

const mockedBrowse = browseProductPage as jest.MockedFunction<typeof browseProductPage>;
const mockedFacets = getProductFacets as jest.MockedFunction<typeof getProductFacets>;

const renderBrand = async (brand: string, category?: string): Promise<void> => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  const Probe: React.FC = () => {
    useBrandProducts(brand, category);
    return null;
  };
  let renderer: ReturnType<typeof ReactTestRenderer.create> | undefined;
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(
      <QueryClientProvider client={queryClient}>
        <Probe />
      </QueryClientProvider>,
    );
  });
  await ReactTestRenderer.act(async () => {
    await Promise.resolve();
  });
  await ReactTestRenderer.act(async () => {
    renderer?.unmount();
  });
};

describe('useBrandProducts', () => {
  beforeEach(() => {
    mockedBrowse.mockClear();
    mockedBrowse.mockResolvedValue({ items: [], total: 0, page: 1, limit: 20 });
    mockedFacets.mockClear();
  });

  it('filters by the brand name and asks for in-stock products only', async () => {
    await renderBrand('Limelight');
    expect(mockedBrowse).toHaveBeenCalledTimes(1);
    expect(mockedBrowse).toHaveBeenCalledWith({
      brand: 'Limelight',
      available: true,
      page: 1,
      limit: 20,
    });
  });

  it('passes brand names containing spaces and parentheses through unchanged', async () => {
    // The API filters on the merchant's own brand_name string, so the name must
    // not be normalised, trimmed of inner punctuation, or turned into an id.
    await renderBrand('Alkaram (Alkaram Studio)');
    expect(mockedBrowse).toHaveBeenCalledWith(
      expect.objectContaining({ brand: 'Alkaram (Alkaram Studio)' }),
    );
  });

  it('trims surrounding whitespace but keeps the name itself intact', async () => {
    await renderBrand('  Maria B  ');
    expect(mockedBrowse).toHaveBeenCalledWith(expect.objectContaining({ brand: 'Maria B' }));
  });

  it('does not query for an empty brand', async () => {
    await renderBrand('   ');
    expect(mockedBrowse).not.toHaveBeenCalled();
  });

  it('uses a distinct cache key per brand', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 } },
    });
    const Probe: React.FC<{ brand: string }> = ({ brand }) => {
      useBrandProducts(brand);
      return null;
    };
    let renderer: ReturnType<typeof ReactTestRenderer.create> | undefined;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <QueryClientProvider client={queryClient}>
          <Probe brand="Limelight" />
        </QueryClientProvider>,
      );
    });
    await ReactTestRenderer.act(async () => {
      await Promise.resolve();
    });
    await ReactTestRenderer.act(async () => {
      renderer?.update(
        <QueryClientProvider client={queryClient}>
          <Probe brand="HSY" />
        </QueryClientProvider>,
      );
    });
    await ReactTestRenderer.act(async () => {
      await Promise.resolve();
    });
    // Switching brands must refetch rather than reuse the previous brand's rows.
    expect(mockedBrowse).toHaveBeenCalledTimes(2);
    expect(mockedBrowse).toHaveBeenLastCalledWith(expect.objectContaining({ brand: 'HSY' }));
    await ReactTestRenderer.act(async () => {
      renderer?.unmount();
    });
  });

  it('scopes the listing to the selected category', async () => {
    await renderBrand('Limelight', 'Ready to Wear');
    expect(mockedBrowse).toHaveBeenCalledWith({
      brand: 'Limelight',
      category: 'Ready to Wear',
      available: true,
      page: 1,
      limit: 20,
    });
  });

  it('omits the category parameter when viewing every category', async () => {
    // "All" must not send an empty category, which would ask the API for
    // products with no category at all.
    await renderBrand('Limelight', undefined);
    expect(mockedBrowse).toHaveBeenCalledWith(
      expect.not.objectContaining({ category: expect.anything() }),
    );
  });

  it('does not reuse cached rows when the category changes', async () => {
    // Regression guard: if the category were missing from the cache key,
    // switching categories would show the previous category's products.
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 } },
    });
    const Probe: React.FC<{ category?: string }> = ({ category }) => {
      useBrandProducts('Limelight', category);
      return null;
    };
    let renderer: ReturnType<typeof ReactTestRenderer.create> | undefined;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <QueryClientProvider client={queryClient}>
          <Probe />
        </QueryClientProvider>,
      );
    });
    await ReactTestRenderer.act(async () => {
      await Promise.resolve();
    });
    await ReactTestRenderer.act(async () => {
      renderer?.update(
        <QueryClientProvider client={queryClient}>
          <Probe category="Ready to Wear" />
        </QueryClientProvider>,
      );
    });
    await ReactTestRenderer.act(async () => {
      await Promise.resolve();
    });
    expect(mockedBrowse).toHaveBeenCalledTimes(2);
    expect(mockedBrowse).toHaveBeenLastCalledWith(
      expect.objectContaining({ category: 'Ready to Wear' }),
    );
    await ReactTestRenderer.act(async () => {
      renderer?.unmount();
    });
  });
});

describe('useBrandFacets', () => {
  beforeEach(() => {
    mockedFacets.mockClear();
  });

  it('asks for the facets of the requested brand', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 } },
    });
    const Probe: React.FC = () => {
      useBrandFacets('Maria B');
      return null;
    };
    let renderer: ReturnType<typeof ReactTestRenderer.create> | undefined;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <QueryClientProvider client={queryClient}>
          <Probe />
        </QueryClientProvider>,
      );
    });
    await ReactTestRenderer.act(async () => {
      await Promise.resolve();
    });
    // Without the brand the API returns the whole catalogue's categories,
    // which would be the wrong options for this screen.
    expect(mockedFacets).toHaveBeenCalledWith({ brand: 'Maria B' });
    await ReactTestRenderer.act(async () => {
      renderer?.unmount();
    });
  });

  it('does not request facets for an empty brand', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 } },
    });
    const Probe: React.FC = () => {
      useBrandFacets('  ');
      return null;
    };
    let renderer: ReturnType<typeof ReactTestRenderer.create> | undefined;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <QueryClientProvider client={queryClient}>
          <Probe />
        </QueryClientProvider>,
      );
    });
    await ReactTestRenderer.act(async () => {
      await Promise.resolve();
    });
    expect(mockedFacets).not.toHaveBeenCalled();
    await ReactTestRenderer.act(async () => {
      renderer?.unmount();
    });
  });
});
