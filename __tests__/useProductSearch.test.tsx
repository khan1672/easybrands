/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { searchProductPage } from '../src/services/api/productApi';
import {
  isSearchableQuery,
  useProductSearch,
} from '../src/features/search/queries/useProductSearch';

jest.mock('../src/services/api/productApi', () => ({
  searchProductPage: jest.fn(async () => ({ items: [], total: 0, page: 1, limit: 20 })),
}));

const mockedSearch = searchProductPage as jest.MockedFunction<typeof searchProductPage>;

const renderSearch = async (query: string): Promise<void> => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  const Probe: React.FC = () => {
    useProductSearch(query);
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

describe('isSearchableQuery', () => {
  it('rejects queries too short to be useful', () => {
    expect(isSearchableQuery('')).toBe(false);
    expect(isSearchableQuery('  ')).toBe(false);
    expect(isSearchableQuery('a')).toBe(false);
    expect(isSearchableQuery('.')).toBe(false);
    expect(isSearchableQuery(' - ')).toBe(false);
  });

  it('accepts queries once they carry enough characters', () => {
    expect(isSearchableQuery('lawn')).toBe(true);
    expect(isSearchableQuery('lawn suit')).toBe(true);
    // Punctuation must not count toward the minimum, otherwise "!!" would search.
    expect(isSearchableQuery('a!')).toBe(false);
    expect(isSearchableQuery('a b')).toBe(true);
  });
});

describe('useProductSearch', () => {
  beforeEach(() => {
    mockedSearch.mockClear();
    mockedSearch.mockResolvedValue({ items: [], total: 0, page: 1, limit: 20 });
  });

  it('does not call the API for a query that is too short', async () => {
    await renderSearch('l');
    expect(mockedSearch).not.toHaveBeenCalled();
  });

  it('sends the trimmed query to the API', async () => {
    await renderSearch('  lawn suit  ');
    expect(mockedSearch).toHaveBeenCalledTimes(1);
    expect(mockedSearch).toHaveBeenCalledWith({ q: 'lawn suit', page: 1, limit: 20 });
  });

  it('treats a brand-name query like any other search', async () => {
    await renderSearch('Limelight');
    expect(mockedSearch).toHaveBeenCalledWith({ q: 'Limelight', page: 1, limit: 20 });
  });
});
