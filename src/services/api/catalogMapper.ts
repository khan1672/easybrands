import type { Product, ProductImage, ProductVariant } from '@typings/product';

/**
 * The API serves MongoDB documents straight from the easybrands.products
 * collection. Those documents are catalog records (brand_name / handle /
 * title / category / images[].src), NOT the UI shape, so they are projected
 * onto Product here. Keep this mapping in sync with the real doc fields.
 */
export interface CatalogDoc {
  _id?: string;
  brand_name?: string;
  handle?: string;
  title?: string;
  category?: string;
  website?: string;
  product_url?: string;
  primary_image?: string;
  images?: { src?: string; url?: string; alt?: string; position?: number }[];
  variants?: { title?: string; sku?: string; price?: number; available?: boolean }[];
  description?: string;
  price?: number;
  compare_at_price?: number;
  compareAtPrice?: number;
  currency?: string;
  available?: boolean;
  colors?: string[];
  rating?: number;
  reviewCount?: number;
  isNew?: boolean;
  [key: string]: unknown;
}

export const toProduct = (raw: unknown): Product | null => {
  const d = (raw ?? {}) as CatalogDoc;
  const brand = String(d.brand_name ?? '').trim();
  const handle = String(d.handle ?? '').trim();
  if (!d.title) return null;

  const slug = brand && handle ? `${brand}:${handle}` : handle || String(d._id ?? '');
  const images: ProductImage[] = (d.images ?? [])
    .map((i) => ({ url: i.src ?? i.url ?? '', alt: i.alt ?? '' }))
    .filter((i) => i.url !== '');
  if (images.length === 0 && d.primary_image) {
    images.push({ url: d.primary_image, alt: d.title });
  }

  // One variant per size; a variant with no title cannot be shown as a button.
  const variants: ProductVariant[] = (d.variants ?? [])
    .map(v => ({
      title: String(v.title ?? '').trim(),
      ...(typeof v.sku === 'string' && v.sku.trim() !== '' ? { sku: v.sku.trim() } : {}),
      ...(Number.isFinite(Number(v.price)) ? { price: Number(v.price) } : {}),
      // Absent stock data must not read as "in stock".
      available: v.available === true,
    }))
    .filter(v => v.title !== '');

  const price = Number(d.price ?? 0);
  const compareRaw = d.compare_at_price ?? d.compareAtPrice;
  const compareAt =
    typeof compareRaw === 'number' && Number.isFinite(compareRaw) && compareRaw > price
      ? compareRaw
      : undefined;

  return {
    id: slug,
    name: String(d.title),
    brandName: brand,
    slug,
    price,
    ...(compareAt !== undefined ? { compareAtPrice: compareAt } : {}),
    currency: d.currency ?? 'PKR',
    categoryId: String(d.category ?? ''),
    images,
    // A missing flag is not the same as "in stock".
    available: d.available === true,
    variants,
    ...(typeof d.description === 'string' && d.description.trim() !== ''
      ? { description: d.description.trim() }
      : {}),
    ...(typeof d.product_url === 'string' && d.product_url.trim() !== ''
      ? { productUrl: d.product_url.trim() }
      : {}),
    ...(typeof d.website === 'string' && d.website.trim() !== ''
      ? { brandWebsite: d.website.trim() }
      : {}),
    ...(handle !== '' ? { handle } : {}),
    colors: d.colors ?? [],
    ...(Number.isFinite(Number(d.rating)) && d.rating !== undefined ? { rating: Number(d.rating) } : {}),
    ...(Number.isFinite(Number(d.reviewCount)) && d.reviewCount !== undefined
      ? { reviewCount: Number(d.reviewCount) }
      : {}),
    isNew: Boolean(d.isNew),
  };
};

/** The API returns { paging, items } — items is the list. */
export const readItems = (data: unknown): unknown[] => {
  if (Array.isArray(data)) return data;
  const d = data as { items?: unknown[]; products?: unknown[]; docs?: unknown[] } | null;
  return d?.items ?? d?.products ?? d?.docs ?? [];
};
