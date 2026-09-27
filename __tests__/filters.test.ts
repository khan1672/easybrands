import {
  activeFilterCount,
  DEFAULT_FILTERS,
  SORT_OPTIONS,
  type CategoryFilters,
} from '@typings/filters';

const filters = (overrides: Partial<CategoryFilters> = {}): CategoryFilters => ({
  ...DEFAULT_FILTERS,
  ...overrides,
});

describe('filters', () => {
  describe('activeFilterCount', () => {
    it('reports nothing active for the defaults', () => {
      expect(activeFilterCount(DEFAULT_FILTERS)).toBe(0);
    });

    it('counts each filter group once, not per value', () => {
      // Three brands selected is one brand filter, not three.
      expect(activeFilterCount(filters({ brands: ['HSY', 'Gul Ahmed', 'Maria B'] }))).toBe(1);
    });

    it('counts an open-ended price range', () => {
      expect(activeFilterCount(filters({ minPrice: 5000 }))).toBe(1);
      expect(activeFilterCount(filters({ maxPrice: 5000 }))).toBe(1);
      expect(activeFilterCount(filters({ minPrice: 500, maxPrice: 5000 }))).toBe(1);
    });

    it('treats the default sort as inactive and any other sort as active', () => {
      expect(activeFilterCount(filters({ sort: DEFAULT_FILTERS.sort }))).toBe(0);
      expect(activeFilterCount(filters({ sort: 'price_desc' }))).toBe(1);
    });

    it('combines independent filters', () => {
      expect(
        activeFilterCount(filters({ brands: ['HSY'], minPrice: 100, sort: 'name_asc' }))
      ).toBe(3);
    });
  });

  describe('SORT_OPTIONS', () => {
    it('offers only sorts the backend can honour', () => {
      // 'newest' is deliberately absent: every document shares one scrape
      // timestamp, so it would silently do nothing.
      expect([...SORT_OPTIONS]).toEqual(['price_asc', 'price_desc', 'name_asc']);
    });
  });
});
