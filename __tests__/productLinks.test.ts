/**
 * @format
 */

import { resolveProductPageUrl } from '../src/features/products/utils/productLinks';

describe('resolveProductPageUrl', () => {
  const brandWebsite = 'https://gulahmedshop.com';
  const handle = 'dyed-cotton-spandex-jersey-ladies-tights-wgkn-mrn-tgt-23-101';

  it('uses the product URL from the catalogue', () => {
    const result = resolveProductPageUrl({
      productUrl: `${brandWebsite}/products/${handle}`,
      brandWebsite,
      handle,
    });
    expect(result).toEqual({ url: `${brandWebsite}/products/${handle}`, builtFrom: 'product_url' });
  });

  /**
   * The behaviour the button must never show: a shopper taps a product and
   * lands on a storefront with no product on it.
   */
  it('never sends the shopper to a bare storefront homepage', () => {
    const result = resolveProductPageUrl({
      productUrl: brandWebsite,
      brandWebsite,
      handle,
    });
    expect(result?.url).toBe(`${brandWebsite}/products/${handle}`);
    expect(result?.builtFrom).toBe('brand_site_and_handle');
  });

  it('treats a homepage with a trailing slash or query the same way', () => {
    expect(resolveProductPageUrl({ productUrl: `${brandWebsite}/`, handle })?.builtFrom).toBe(
      'brand_site_and_handle',
    );
    expect(
      resolveProductPageUrl({ productUrl: `${brandWebsite}?ref=app`, handle })?.builtFrom,
    ).toBe('brand_site_and_handle');
  });

  it('builds the product page when the record has no product URL', () => {
    const result = resolveProductPageUrl({ productUrl: null, brandWebsite, handle });
    expect(result).toEqual({
      url: `${brandWebsite}/products/${handle}`,
      builtFrom: 'brand_site_and_handle',
    });
  });

  it('builds from the site origin when the brand website has a path', () => {
    const result = resolveProductPageUrl({
      brandWebsite: 'https://shop.pk/collections/sale',
      handle: 'blue-kurta',
    });
    expect(result?.url).toBe('https://shop.pk/products/blue-kurta');
  });

  it('trims stray slashes from the handle', () => {
    expect(resolveProductPageUrl({ brandWebsite, handle: '/blue-kurta/' })?.url).toBe(
      `${brandWebsite}/products/blue-kurta`,
    );
  });

  /**
   * No product page can be determined, so the caller shows an error rather than
   * silently substituting the brand homepage.
   */
  it('returns null when nothing identifies the product', () => {
    expect(resolveProductPageUrl({})).toBeNull();
    expect(resolveProductPageUrl({ productUrl: null, brandWebsite: null, handle: null })).toBeNull();
  });

  it('returns null when there is no handle to build a URL from', () => {
    expect(resolveProductPageUrl({ brandWebsite, handle: '' })).toBeNull();
    expect(resolveProductPageUrl({ brandWebsite, handle: '   ' })).toBeNull();
    expect(resolveProductPageUrl({ brandWebsite, handle: '///' })).toBeNull();
  });

  /* eslint-disable no-script-url */
  it('ignores an unsafe product URL instead of opening it', () => {
    const result = resolveProductPageUrl({
      productUrl: 'javascript:alert(1)',
      brandWebsite,
      handle,
    });
    expect(result?.url).toBe(`${brandWebsite}/products/${handle}`);
  });

  it('rejects a non-http brand website', () => {
    expect(resolveProductPageUrl({ brandWebsite: 'ftp://shop.pk', handle })).toBeNull();
  });
});
