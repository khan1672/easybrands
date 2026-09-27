export interface ProductImage {
  url: string;
  alt: string;
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
   * Reviews are not present in the scraped catalogue, so these are absent
   * rather than 0. Optional on purpose: a required number would render as a
   * real "0.0 (0)" rating on every product.
   */
  rating?: number;
  reviewCount?: number;
  isNew: boolean;
}