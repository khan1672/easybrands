import { useInfiniteQuery } from '@tanstack/react-query';
import { searchProductPage } from '@services/api/productApi';

/**
 * Search is deliberately short-lived: a shopper who refines a query expects
 * fresh results, and the catalogue changes whenever a brand store does.
 */
const SEARCH_STALE_TIME = 30 * 1000;

export const SEARCH_PAGE_SIZE = 20;

/**
 * A single character matches most of the catalogue and tells the shopper
 * nothing, so queries shorter than this never hit the network.
 */
export const MIN_SEARCH_LENGTH = 2;

/** Shared tokenizer: matches the backend so the UI and API agree on "no query". */
export const isSearchableQuery = (query: string): boolean =>
  (query.match(/[a-z0-9]+/gi) ?? []).join('').length >= MIN_SEARCH_LENGTH;

/**
 * Paged, debounced-at-the-call-site search results.
 *
 * Relevance ranking happens in the API, so the app never re-sorts: paging
 * follows the server order exactly.
 */
export const useProductSearch = (query: string) => {
  const trimmed = query.trim();
  return useInfiniteQuery({
    queryKey: ['products', 'search', trimmed],
    queryFn: ({ pageParam }) => searchProductPage({ q: trimmed, page: pageParam, limit: SEARCH_PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: lastPage => {
      const loaded = lastPage.page * lastPage.limit;
      return loaded < lastPage.total ? lastPage.page + 1 : undefined;
    },
    staleTime: SEARCH_STALE_TIME,
    enabled: isSearchableQuery(trimmed),
  });
};
