import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { browseProductPage, getProductFacets } from '@services/api/productApi';
import { DEFAULT_FILTERS, IN_STOCK_ONLY, type CategoryFilters } from '@typings/filters';

/** Product details change rarely; a category listing can be cached this long. */
const CATEGORY_PRODUCTS_STALE_TIME = 5 * 60 * 1000;

/** Facet options change with the catalogue, not with a filter selection. */
const FACETS_STALE_TIME = 10 * 60 * 1000;

export const CATEGORY_PAGE_SIZE = 20;

/**
 * Paginated products for one canonical category, narrowed by `filters`.
 *
 * The backend takes `page`/`limit` rather than cursors, so paging is
 * page-based and `getNextPageParam` compares what has been loaded against the
 * server-reported total. Every filter that changes the result set is part of
 * the query key, so adjusting a filter can never show a stale mix of two
 * result sets.
 */
export const useCategoryProducts = (category: string, filters: CategoryFilters) => {
  const { brands, minPrice, maxPrice, sort } = filters;
  return useInfiniteQuery({
    queryKey: [
      'products',
      'category',
      category,
      { brands: [...brands].sort(), minPrice, maxPrice, sort },
    ],
    queryFn: ({ pageParam }) =>
      browseProductPage({
        category,
        brands,
        minPrice,
        maxPrice,
        sort,
        available: IN_STOCK_ONLY,
        page: pageParam,
        limit: CATEGORY_PAGE_SIZE,
      }),
    initialPageParam: 1,
    getNextPageParam: lastPage => {
      const loaded = lastPage.page * lastPage.limit;
      return loaded < lastPage.total ? lastPage.page + 1 : undefined;
    },
    staleTime: CATEGORY_PRODUCTS_STALE_TIME,
    enabled: category.trim().length > 0,
  });
};

/**
 * Brand counts and a price range for the category, used to populate the filter
 * panel. Deliberately unscoped by the current brand/price selection so the
 * available options stay visible while filtering.
 */
export const useCategoryFacets = (category: string) =>
  useQuery({
    queryKey: ['products', 'facets', category],
    queryFn: () => getProductFacets({ category }),
    staleTime: FACETS_STALE_TIME,
    enabled: category.trim().length > 0,
  });

export { DEFAULT_FILTERS };
