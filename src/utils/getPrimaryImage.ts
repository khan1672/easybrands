import { Product, ProductImage } from '@typings/product';

/**
 * Returns the product's primary image, or undefined when the product has no
 * usable image.
 *
 * Scraper data is not guaranteed to include imagery: 65 of the 5,475
 * EasyBrands products have neither `primary_image` nor an `images[0]`, so
 * callers must never index into `images` directly. `find` also skips entries
 * whose url is an empty or whitespace-only string.
 */
export const getPrimaryImage = (product: Product): ProductImage | undefined =>
  product.images.find(image => image.url.trim().length > 0);
