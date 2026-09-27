import { create } from 'zustand';
import { DEFAULT_FILTERS, type CategoryFilters } from '@typings/filters';

interface CategoryFilterState {
  filters: CategoryFilters;
  /** Commits `next` and makes the product list refetch from page 1. */
  applyFilters: (next: CategoryFilters) => void;
  resetFilters: () => void;
}

/**
 * Active filter selection for category listings.
 *
 * The filter *options* (brand counts, price range) are server data and stay in
 * TanStack Query; only the selection is client state. Held outside the screen so
 * the selection survives navigation, but deliberately not persisted to MMKV: it
 * is per-visit UI state, not a durable preference.
 */
export const useCategoryFilterStore = create<CategoryFilterState>(set => ({
  filters: DEFAULT_FILTERS,
  applyFilters: next => set({ filters: next }),
  resetFilters: () => set({ filters: DEFAULT_FILTERS }),
}));
