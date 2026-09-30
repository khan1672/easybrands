/**
 * @format
 */

import { getProductFacets } from '../src/services/api/productApi';
import { apiGet } from '../src/services/api/apiRequest';

jest.mock('../src/services/api/apiRequest', () => ({
  apiGet: jest.fn(),
}));

const mockedApiGet = apiGet as jest.MockedFunction<typeof apiGet>;

const respond = (payload: unknown): void => {
  mockedApiGet.mockResolvedValue({ data: payload } as never);
};

const paramsOf = (call: number): Record<string, unknown> => {
  const [, config] = mockedApiGet.mock.calls[call] as [string, { params: Record<string, unknown> }];
  return config.params;
};

describe('getProductFacets', () => {
  beforeEach(() => {
    mockedApiGet.mockReset();
    respond({ brands: [], categories: [], price: { min: 0, max: 0 }, total: 0 });
  });

  it('requests the facets of a single brand', async () => {
    await getProductFacets({ brand: 'Limelight' });
    // The brand scope is what makes the API return that brand's categories.
    expect(paramsOf(0)).toMatchObject({ brand: 'Limelight' });
  });

  it('joins several brands into the comma-separated form the API expects', async () => {
    await getProductFacets({ brands: ['Maria B', 'HSY'] });
    expect(paramsOf(0)).toMatchObject({ brand: 'Maria B,HSY' });
  });

  it('omits the brand when browsing the whole catalogue', async () => {
    await getProductFacets();
    expect(paramsOf(0)).not.toHaveProperty('brand');
  });

  it('maps category names, slugs and counts from the payload', async () => {
    respond({
      brands: [{ name: 'Limelight', count: 539 }],
      categories: [
        { name: 'Ready to Wear', slug: 'ready-to-wear', count: 152 },
        { name: 'Unstitched', slug: 'unstitched', count: 88 },
      ],
      price: { min: 1490, max: 8990 },
      total: 539,
    });

    const facets = await getProductFacets({ brand: 'Limelight' });

    expect(facets.categories).toEqual([
      { name: 'Ready to Wear', slug: 'ready-to-wear', count: 152 },
      { name: 'Unstitched', slug: 'unstitched', count: 88 },
    ]);
  });

  it('drops categories with no products so no chip leads to an empty grid', async () => {
    respond({
      brands: [],
      categories: [
        { name: 'Ready to Wear', slug: 'ready-to-wear', count: 152 },
        { name: 'Formalwear', slug: 'formalwear', count: 0 },
        { name: '  ', slug: 'blank', count: 12 },
      ],
      price: { min: 0, max: 0 },
      total: 152,
    });

    const facets = await getProductFacets({ brand: 'Limelight' });

    expect(facets.categories).toEqual([
      { name: 'Ready to Wear', slug: 'ready-to-wear', count: 152 },
    ]);
  });

  it('returns an empty category list when the payload has none', async () => {
    respond({ brands: [], price: { min: 0, max: 0 }, total: 0 });
    const facets = await getProductFacets({ brand: 'Limelight' });
    expect(facets.categories).toEqual([]);
  });
});
