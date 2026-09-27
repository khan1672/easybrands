/**
 * Filter and sort options for a category listing.
 *
 * `SortKey` mirrors the backend's SORT_KEYS. There is no "newest" option
 * because every document carries the same scrape timestamp, so it would be a
 * no-op presented as a feature.
 */
export const SORT_OPTIONS = ['price_asc', 'price_desc', 'name_asc'] as const;
export type SortKey = (typeof SORT_OPTIONS)[number];

export interface CategoryFilters {
  /** Brand names, matched with OR. Empty means every brand. */
  brands: string[];
  minPrice?: number;
  maxPrice?: number;
  sort: SortKey;
}

/**
 * Category listings only ever show in-stock products: out-of-stock items have no
 * size or colour data and cannot be added to a bag, so listing them alongside
 * purchasable ones was misleading. The API still supports `available=false` if
 * that decision is ever revisited, but it is not surfaced here.
 */
export const IN_STOCK_ONLY = true;

export const DEFAULT_FILTERS: CategoryFilters = {
  brands: [],
  sort: 'price_asc',
};

export interface FacetBrand {
  name: string;
  count: number;
}

export interface ProductFacets {
  brands: FacetBrand[];
  price: { min: number; max: number };
  total: number;
}

/** How many filters differ from the defaults, for the badge on the button. */
export const activeFilterCount = (filters: CategoryFilters): number => {
  let count = 0;
  if (filters.brands.length > 0) count += 1;
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) count += 1;
  if (filters.sort !== DEFAULT_FILTERS.sort) count += 1;
  return count;
};
