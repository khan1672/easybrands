export interface ProductImage {
  url: string;
  alt: string;
}

/**
 * A purchasable size. The scraped catalogue has one variant per size with its
 * own SKU, price and stock flag; there is no separate colour axis, so a variant
 * is a size and nothing else.
 */
export interface ProductVariant {
  title: string;
  sku?: string;
  price?: number;
  available: boolean;
}

export interface Product {
  id: string;
  name: string;
  /**
   * Brand name as scraped, e.g. "HSY" or "J. (Junaid Jamshed)". Empty when the
   * source document had none.
   *
   * There is no brand logo in the data: the /brands `image` field holds a
   * representative product photo, not a logo, so the name is what identifies a
   * brand in the UI.
   */
  brandName: string;
  slug: string;
  price: number;
  compareAtPrice?: number;
  currency: string;
  categoryId: string;
  images: ProductImage[];
  colors: string[];
  /**
   * Product-level stock. List endpoints return in-stock products only, so this
   * is true there; the detail document reports the real flag.
   */
  available: boolean;
  /** Sizes, in the order the merchant listed them. */
  variants: ProductVariant[];
  /** Merchant description text. Plain text from the scrape. */
  description?: string;
  /** Absolute URL of the product on the brand's own storefront. */
  productUrl?: string;
  /** The brand's storefront root. */
  brandWebsite?: string;
  /** Storefront slug, e.g. 'rust-tights-tr-22-50'. Used to build the product page. */
  handle?: string;
  /**
   * Reviews are not present in the scraped catalogue, so these are absent
   * rather than 0. Optional on purpose: a required number would render as a
   * real "0.0 (0)" rating on every product.
   */
  rating?: number;
  reviewCount?: number;
  isNew: boolean;
}