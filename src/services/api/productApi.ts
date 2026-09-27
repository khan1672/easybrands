import { apiGet, mockFallback, type QueryParams } from './apiRequest';
import { toProduct, readItems } from './catalogMapper';
import type { Product } from '@typings/product';
import { mockProducts } from './mockData';

export interface ProductListParams {
  page?: number;
  limit?: number;
  brand?: string;
  category?: string;
  available?: boolean;
}

export const browseProducts = async (params: ProductListParams = {}): Promise<Product[]> => {
  const query: QueryParams = {
    page: params.page ?? 1,
    limit: params.limit ?? 20,
    ...(params.brand ? { brand: params.brand } : {}),
    ...(params.category ? { category: params.category } : {}),
    ...(params.available !== undefined ? { available: params.available } : {}),
  };

  try {
    const { data } = await apiGet<unknown>('/products', { params: query });
    return readItems(data)
      .map(toProduct)
      .filter((p): p is Product => p !== null);
  } catch (e) {
    return mockFallback(e, mockProducts, 'products');
  }
};

export const searchProducts = async (q: string): Promise<Product[]> => {
  try {
    const { data } = await apiGet<unknown>('/products/search', { params: { q } });
    return readItems(data)
      .map(toProduct)
      .filter((p): p is Product => p !== null);
  } catch (e) {
    return mockFallback(e, [], 'search');
  }
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
