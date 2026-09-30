import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { browseProductPage, getProductFacets } from '@services/api/productApi';
import { IN_STOCK_ONLY } from '@typings/filters';

/** A brand listing changes on the same schedule as a category listing. */
const BRAND_PRODUCTS_STALE_TIME = 5 * 60 * 1000;

/** Category options follow the catalogue, not the shopper's selection. */
const BRAND_FACETS_STALE_TIME = 10 * 60 * 1000;

export const BRAND_PAGE_SIZE = 20;

/**
 * Paged products for one brand, newest first.
 *
 * The brand is passed as the merchant's own `brand_name` string, which is what
 * the API filters on, so names containing spaces or parentheses ("Alkaram
 * (Alkaram Studio)") match exactly. Delisted products are excluded by the API
 * rather than here, so a brand page can never surface a dead product link.
 */
export const useBrandProducts = (brand: string, category?: string) => {
  const trimmed = brand.trim();
  // The selected category is part of the cache key, so switching categories
  // refetches page 1 instead of appending to the previous category's rows.
  const selected = category?.trim() ?? '';
  return useInfiniteQuery({
    queryKey: ['products', 'brand', trimmed, selected],
    queryFn: ({ pageParam }) =>
      browseProductPage({
        brand: trimmed,
        ...(selected !== '' ? { category: selected } : {}),
        available: IN_STOCK_ONLY,
        page: pageParam,
        limit: BRAND_PAGE_SIZE,
      }),
    initialPageParam: 1,
    getNextPageParam: lastPage => {
      const loaded = lastPage.page * lastPage.limit;
      return loaded < lastPage.total ? lastPage.page + 1 : undefined;
    },
    staleTime: BRAND_PRODUCTS_STALE_TIME,
    enabled: trimmed.length > 0,
  });
};

/**
 * The categories this brand actually sells, with counts, for the category rail.
 *
 * Unfiltered by the selected category on purpose: the rail has to keep showing
 * every option, including the one the shopper is currently inside.
 */
export const useBrandFacets = (brand: string) => {
  const trimmed = brand.trim();
  return useQuery({
    queryKey: ['products', 'facets', 'brand', trimmed],
    queryFn: () => getProductFacets({ brand: trimmed }),
    staleTime: BRAND_FACETS_STALE_TIME,
    enabled: trimmed.length > 0,
  });
};
