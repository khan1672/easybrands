import { apiGet, mockFallback } from './apiRequest';
import type { Category } from '@typings/category';
import type { HeroBanner } from '@typings/home';
import { mockHeroBanner, mockCategories } from './mockData';

const CATEGORIES = '/categories';
const BRANDS = '/brands';

/** The API returns { paging, items } — items is the category list. */
const readItems = (data: unknown): unknown[] => {
  if (Array.isArray(data)) return data;
  const d = data as { items?: unknown[]; categories?: unknown[]; docs?: unknown[] };
  return d?.items ?? d?.categories ?? d?.docs ?? [];
};

interface RawCategory {
  name?: string;
  slug?: string;
  products?: number;
  brands?: number;
  image?: string;
}

/**
 * Categories come from the products themselves: the API folds the 192 raw
 * merchant `product_type` values into a canonical set, and each name is also
 * valid as a `?category=` filter on /products.
 */
const toCategory = (raw: unknown): Category => {
  const c = raw as RawCategory;
  const name = c?.name ?? '';
  return {
    id: c?.slug ?? name,
    name,
    image: c?.image ?? '',
    productCount: c?.products ?? 0,
  };
};

export const getCategories = async (): Promise<Category[]> => {
  try {
    const { data } = await apiGet<unknown>(CATEGORIES, { params: { page: 1, limit: 50 } });
    return readItems(data)
      .map(toCategory)
      .filter((c) => c.name !== '');
  } catch (e) {
    return mockFallback(e, mockCategories, 'categories');
  }
};

const toBrand = (raw: unknown): Category => {
  const b = raw as {
    id?: string;
    brand_name?: string;
    name?: string;
    website?: string;
    image?: string;
    products?: number;
  };
  const name = b.name ?? b.brand_name ?? '';
  return {
    id: b.id ?? b.website ?? name,
    name,
    image: b.image ?? '',
    productCount: b.products ?? 0,
  };
};

/** Brand tiles, kept for the brand browse screen — not for "Shop by Category". */
export const getBrands = async (): Promise<Category[]> => {
  try {
    const { data } = await apiGet<unknown>(BRANDS, { params: { page: 1, limit: 50 } });
    return readItems(data)
      .map(toBrand)
      .filter((b) => b.name !== '');
  } catch (e) {
    return mockFallback(e, mockCategories, 'categories');
  }
};

/** No /hero endpoint exists on the API, so the banner stays local. */
export const getHeroBanner = (): Promise<HeroBanner> => Promise.resolve(mockHeroBanner);
