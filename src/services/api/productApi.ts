import { apiGet, mockFallback, type QueryParams } from './apiRequest';
import { toProduct, readItems } from './catalogMapper';
import type { Product } from '@typings/product';
import type { ProductFacets, SortKey } from '@typings/filters';
import { mockProducts } from './mockData';

export interface ProductListParams {
  page?: number;
  limit?: number;
  brand?: string;
  /** Brand names matched with OR; the API also accepts a comma-separated `brand`. */
  brands?: string[];
  category?: string;
  available?: boolean;
  minPrice?: number;
  maxPrice?: number;
  sort?: SortKey;
}

export interface ProductPage {
  items: Product[];
  total: number;
  page: number;
  limit: number;
}

interface PagingPayload {
  paging?: { page?: number; limit?: number; offset?: number; total?: number };
}

/**
 * One page of products plus the server-side total, so a list can tell whether
 * more pages exist instead of guessing from a short page.
 */
export const browseProductPage = async (params: ProductListParams = {}): Promise<ProductPage> => {
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;
  const query: QueryParams = {
    page,
    limit,
    ...(params.brand ? { brand: params.brand } : {}),
    ...(params.brands && params.brands.length > 0 ? { brand: params.brands.join(',') } : {}),
    ...(params.category ? { category: params.category } : {}),
    ...(params.available !== undefined ? { available: params.available } : {}),
    ...(params.minPrice !== undefined ? { minPrice: params.minPrice } : {}),
    ...(params.maxPrice !== undefined ? { maxPrice: params.maxPrice } : {}),
    ...(params.sort ? { sort: params.sort } : {}),
  };

  try {
    const { data } = await apiGet<unknown>('/products', { params: query });
    const items = readItems(data)
      .map(toProduct)
      .filter((p): p is Product => p !== null);
    const paging = (data as PagingPayload | null)?.paging;
    return {
      items,
      total: paging?.total ?? items.length,
      page: paging?.page ?? page,
      limit: paging?.limit ?? limit,
    };
  } catch (e) {
    return mockFallback(e, { items: mockProducts, total: mockProducts.length, page, limit }, 'products');
  }
};

export const browseProducts = async (params: ProductListParams = {}): Promise<Product[]> => {
  const { items } = await browseProductPage(params);
  return items;
};

/** Same scope as `browseProductPage`, minus paging: used to build filter options. */
export const getProductFacets = async (params: ProductListParams = {}): Promise<ProductFacets> => {
  const query: QueryParams = {
    ...(params.category ? { category: params.category } : {}),
    // The brand scope is what makes /products/facets return that brand's
    // categories rather than the whole catalogue's.
    ...(params.brand ? { brand: params.brand } : {}),
    ...(params.brands && params.brands.length > 0 ? { brand: params.brands.join(',') } : {}),
  };
  try {
    const { data } = await apiGet<unknown>('/products/facets', { params: query });
    return toFacets(data);
  } catch (e) {
    return mockFallback(
      e,
      { brands: [], categories: [], price: { min: 0, max: 0 }, total: 0 },
      'product facets',
    );
  }
};

export const DEFAULT_SEARCH_PAGE_SIZE = 20;

/** Mirrors the backend tokenizer so mock mode filters the same way the API does. */
const tokenizeQuery = (q: string): string[] => q.toLowerCase().match(/[a-z0-9]+/g) ?? [];

const matchesSearchTerms = (product: Product, terms: string[]): boolean => {
  const haystack = [product.brandName, product.name, product.categoryId, product.description]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return terms.every(term => haystack.includes(term));
};

/**
 * One page of search results, ranked server-side by relevance across product
 * name, brand name, tags, category and description. The backend requires every
 * term to match somewhere, so a query can span fields.
 */
export const searchProductPage = async (params: {
  q: string;
  page?: number;
  limit?: number;
}): Promise<ProductPage> => {
  const page = params.page ?? 1;
  const limit = params.limit ?? DEFAULT_SEARCH_PAGE_SIZE;
  const query: QueryParams = { q: params.q, page, limit };

  try {
    const { data } = await apiGet<unknown>('/products/search', { params: query });
    const items = readItems(data)
      .map(toProduct)
      .filter((p): p is Product => p !== null);
    const paging = (data as PagingPayload | null)?.paging;
    return {
      items,
      total: paging?.total ?? items.length,
      page: paging?.page ?? page,
      limit: paging?.limit ?? limit,
    };
  } catch (e) {
    const terms = tokenizeQuery(params.q);
    const hits = terms.length > 0 ? mockProducts.filter(p => matchesSearchTerms(p, terms)) : [];
    const offset = (page - 1) * limit;
    return mockFallback(
      e,
      { items: hits.slice(offset, offset + limit), total: hits.length, page, limit },
      'search',
    );
  }
};

export const searchProducts = async (q: string): Promise<Product[]> => {
  const { items } = await searchProductPage({ q, limit: DEFAULT_SEARCH_PAGE_SIZE });
  return items;
};

export const getProductBySlug = async (slug: string): Promise<Product | null> => {
  try {
    const { data } = await apiGet<unknown>(`/products/${encodeURIComponent(slug)}`);
    const raw = (data as { product?: unknown })?.product ?? data;
    return toProduct(raw);
  } catch (e) {
    return mockFallback(e, null, 'product detail');
  }
};

export const getProducts = (): Promise<Product[]> => browseProducts();

interface FacetsPayload {
  brands?: { name?: string; count?: number }[];
  categories?: { name?: string; slug?: string; count?: number }[];
  price?: { min?: number; max?: number };
  total?: number;
}

const toFacets = (raw: unknown): ProductFacets => {
  const d = (raw ?? {}) as FacetsPayload;
  return {
    brands: (d.brands ?? [])
      .map((b) => ({ name: String(b.name ?? '').trim(), count: Number(b.count ?? 0) }))
      .filter((b) => b.name !== ''),
    categories: (d.categories ?? [])
      .map((c) => ({
        name: String(c.name ?? '').trim(),
        slug: String(c.slug ?? '').trim(),
        count: Number(c.count ?? 0),
      }))
      // A category the API reports with no products cannot be browsed, so it is
      // dropped rather than shown as a chip that leads to an empty grid.
      .filter((c) => c.name !== '' && c.count > 0),
    price: { min: Number(d.price?.min ?? 0), max: Number(d.price?.max ?? 0) },
    total: Number(d.total ?? 0),
  };
};
