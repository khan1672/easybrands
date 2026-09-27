/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { browseProductPage } from '../src/services/api/productApi';
import { useCategoryProducts } from '../src/features/categories/queries/useCategoryProducts';
import { DEFAULT_FILTERS, type CategoryFilters } from '../src/types/filters';

jest.mock('../src/services/api/productApi', () => ({
  browseProductPage: jest.fn(async () => ({ items: [], total: 0, page: 1, limit: 20 })),
  getProductFacets: jest.fn(async () => ({ brands: [], price: { min: 0, max: 0 }, total: 0 })),
}));

const mockedBrowse = browseProductPage as jest.MockedFunction<typeof browseProductPage>;

const renderHook = async (filters: CategoryFilters): Promise<void> => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  const Probe: React.FC = () => {
    useCategoryProducts('Ready to Wear', filters);
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
  renderer?.unmount();
};

describe('useCategoryProducts', () => {
  beforeEach(() => {
    mockedBrowse.mockClear();
  });

  it('always requests in-stock products, with no way to opt out', async () => {
    await renderHook(DEFAULT_FILTERS);
    expect(mockedBrowse).toHaveBeenCalled();
    for (const call of mockedBrowse.mock.calls) {
      expect(call[0]?.available).toBe(true);
    }
  });

  it('forwards the selected filters to the API', async () => {
    await renderHook({ brands: ['HSY', 'Maria B'], minPrice: 1000, maxPrice: 9000, sort: 'price_desc' });
    expect(mockedBrowse).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'Ready to Wear',
        brands: ['HSY', 'Maria B'],
        minPrice: 1000,
        maxPrice: 9000,
        sort: 'price_desc',
        available: true,
        page: 1,
      }),
    );
  });

  it('omits the price bounds when no range is set', async () => {
    await renderHook(DEFAULT_FILTERS);
    const params = mockedBrowse.mock.calls[0]?.[0];
    expect(params?.minPrice).toBeUndefined();
    expect(params?.maxPrice).toBeUndefined();
  });
});
