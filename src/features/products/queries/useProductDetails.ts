import { useQuery } from '@tanstack/react-query';
import { getProductBySlug } from '@services/api/productApi';

/** Matches the caching policy for product details in AGENTS.md. */
const PRODUCT_DETAILS_STALE_TIME = 5 * 60 * 1000;

export const productDetailsKey = (slug: string) => ['products', 'detail', slug] as const;

/**
 * A single product, keyed by its slug. The slug is `brand:handle`, which the
 * backend splits back into the two fields it filters on, so the card's id can be
 * handed straight to the detail route.
 */
export const useProductDetails = (slug: string) =>
  useQuery({
    queryKey: productDetailsKey(slug),
    queryFn: () => getProductBySlug(slug),
    staleTime: PRODUCT_DETAILS_STALE_TIME,
    enabled: slug.trim().length > 0,
  });
