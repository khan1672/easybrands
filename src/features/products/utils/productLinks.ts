/**
 * Where the "View on Brand Site" button should send a shopper.
 *
 * The button promises a specific product, so it must never fall back to a brand
 * homepage: someone tapping it is looking for this garment, and a storefront
 * landing page makes them hunt for it. Scraped records can be missing a product
 * URL or carry a bare domain, so those are rebuilt from the brand site and the
 * product handle, which is how these storefronts are structured.
 */

/** Path used by the storefronts in this catalogue for a product page. */
const PRODUCT_PATH_PREFIX = '/products/';

export interface ProductLinkSource {
  productUrl?: string | null;
  brandWebsite?: string | null;
  handle?: string | null;
}

export type ResolvedProductLink =
  | { url: string; builtFrom: 'product_url' }
  | { url: string; builtFrom: 'brand_site_and_handle' }
  | null;

const parseHttpUrl = (raw: string | null | undefined): URL | null => {
  if (typeof raw !== 'string' || raw.trim().length === 0) {
    return null;
  }
  try {
    const parsed = new URL(raw.trim());
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

/** True when the URL points at something more specific than the storefront root. */
const isProductLevel = (url: URL): boolean => {
  const path = url.pathname.replace(/\/+$/, '');
  return path.length > 0;
};

const buildFromSite = (site: URL | null, handle: string | null | undefined): string | null => {
  const slug = typeof handle === 'string' ? handle.trim() : '';
  if (!site || slug.length === 0) {
    return null;
  }
  const cleanSlug = slug.replace(/^\/+|\/+$/g, '');
  if (cleanSlug.length === 0) {
    return null;
  }
  return `${site.origin}${PRODUCT_PATH_PREFIX}${cleanSlug}`;
};

/**
 * The product page for a product, or null when no product page can be
 * determined. Returning null makes the caller show an error rather than send
 * the shopper somewhere that is not the product.
 */
export const resolveProductPageUrl = ({
  productUrl,
  brandWebsite,
  handle,
}: ProductLinkSource): ResolvedProductLink => {
  const product = parseHttpUrl(productUrl);
  if (product && isProductLevel(product)) {
    return { url: product.toString(), builtFrom: 'product_url' };
  }

  // A record whose product URL is only the storefront still names the site, so
  // it can be rebuilt before falling back to the recorded brand website.
  const rebuilt =
    buildFromSite(product, handle) ?? buildFromSite(parseHttpUrl(brandWebsite), handle);
  if (rebuilt) {
    return { url: rebuilt, builtFrom: 'brand_site_and_handle' };
  }

  return null;
};
