/**
 * @format
 */

import { toProduct } from '../src/services/api/catalogMapper';
import type { Product } from '../src/types/product';

/**
 * Shape mirrors a real document from the easybrands.products collection, so a
 * change to the mapper that breaks against production data fails here first.
 */
const realDoc = {
  _id: '6ab79cb2b035345de447fbc3',
  brand_name: 'Gul Ahmed',
  website: 'https://gulahmedshop.com',
  handle: 'dyed-cotton-spandex-jersey-ladies-tights-wgkn-mrn-tgt-23-101',
  title: 'Dyed Cotton Spandex Jersey Ladies Tights',
  category: 'Women',
  product_url: 'https://gulahmedshop.com/products/dyed-cotton-spandex-jersey-ladies-tights',
  primary_image: 'https://cdn.shopify.com/s/files/1/0706/3253/8159/files/wgkn-mrn-tgt-23-101_3.jpg',
  images: [
    { src: 'https://cdn.shopify.com/s/files/1/a.jpg' },
    { src: 'https://cdn.shopify.com/s/files/1/b.jpg' },
  ],
  price: 500,
  compare_at_price: 1529,
  currency: 'PKR',
  available: true,
  description: 'Design Name : WGKN-MRN-TGT-23-101',
  variants: [
    { title: 'X-Small', sku: 'W-AP-23-378673', price: 500, available: false },
    { title: 'Small', sku: 'W-AP-23-378674', price: 500, available: true },
  ],
};

describe('toProduct', () => {
  const product = toProduct(realDoc) as Product;

  it('maps the brand and the slug used for navigation', () => {
    expect(product.brandName).toBe('Gul Ahmed');
    expect(product.id).toBe(
      'Gul Ahmed:dyed-cotton-spandex-jersey-ladies-tights-wgkn-mrn-tgt-23-101',
    );
  });

  it('maps sizes with their own stock flag and price', () => {
    expect(product.variants).toEqual([
      { title: 'X-Small', sku: 'W-AP-23-378673', price: 500, available: false },
      { title: 'Small', sku: 'W-AP-23-378674', price: 500, available: true },
    ]);
  });

  it('keeps the merchant comparison price and description', () => {
    expect(product.compareAtPrice).toBe(1529);
    expect(product.description).toBe('Design Name : WGKN-MRN-TGT-23-101');
    expect(product.productUrl).toBe(
      'https://gulahmedshop.com/products/dyed-cotton-spandex-jersey-ladies-tights',
    );
    expect(product.brandWebsite).toBe('https://gulahmedshop.com');
  });

  it('maps stock availability', () => {
    expect(product.available).toBe(true);
  });

  // A variant with no stock field must not be presented as buyable.
  it('treats a variant with no availability flag as out of stock', () => {
    const p = toProduct({ ...realDoc, variants: [{ title: 'Small', sku: 'x' }] }) as Product;
    expect(p.variants[0].available).toBe(false);
  });

  it('drops variants with no title, which cannot be shown as a button', () => {
    const p = toProduct({
      ...realDoc,
      variants: [{ sku: 'a', available: true }, { title: '  ', available: true }, { title: 'M', available: true }],
    }) as Product;
    expect(p.variants).toHaveLength(1);
    expect(p.variants[0].title).toBe('M');
  });

  it('omits rating rather than reporting a fabricated zero', () => {
    expect(product.rating).toBeUndefined();
    expect(product.reviewCount).toBeUndefined();
  });

  it('treats a missing availability flag on the product as out of stock', () => {
    const p = toProduct({ ...realDoc, available: undefined }) as Product;
    expect(p.available).toBe(false);
  });

  it('returns null when the document has no title', () => {
    expect(toProduct({ ...realDoc, title: undefined })).toBeNull();
  });
});
