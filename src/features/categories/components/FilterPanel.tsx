import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { AppInput, AppText } from '@components/ui';
import { Skeleton } from '@components/feedback';
import { colors } from '@theme/colors';
import { radius } from '@theme/radius';
import { spacing } from '@theme/spacing';
import { strings } from '@utils/strings';
import { formatCurrency } from '@utils/formatCurrency';
import {
  SORT_OPTIONS,
  type CategoryFilters,
  type ProductFacets,
  type SortKey,
} from '@typings/filters';

interface FilterPanelProps {
  facets: ProductFacets | undefined;
  facetsLoading: boolean;
  /** Filters currently applied to the list. */
  applied: CategoryFilters;
  /** Filters being edited; only committed when Apply is pressed. */
  draft: CategoryFilters;
  onChangeDraft: (next: CategoryFilters) => void;
  currency: string;
}

const SORT_LABELS: Record<SortKey, string> = {
  price_asc: strings.sortPriceAsc,
  price_desc: strings.sortPriceDesc,
  name_asc: strings.sortNameAsc,
};

const parseAmount = (raw: string): number | undefined => {
  const trimmed = raw.trim();
  if (trimmed === '') return undefined;
  const n = Number(trimmed);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
};

/**
 * Brand, price, availability and sort controls for a category listing.
 *
 * Edits stay local to `draft` so scrolling the product list underneath is not
 * disturbed until Apply is pressed.
 */
export const FilterPanel: React.FC<FilterPanelProps> = ({
  facets,
  facetsLoading,
  applied,
  draft,
  onChangeDraft,
  currency,
}) => {
  const [minRaw, setMinRaw] = useState<string>('');
  const [maxRaw, setMaxRaw] = useState<string>('');
  const [swapped, setSwapped] = useState(false);

  // Seed the price fields from the applied filters each time the sheet opens,
  // so a cancelled edit does not leak into the next one.
  useEffect(() => {
    setMinRaw(applied.minPrice === undefined ? '' : String(applied.minPrice));
    setMaxRaw(applied.maxPrice === undefined ? '' : String(applied.maxPrice));
    setSwapped(false);
  }, [applied.minPrice, applied.maxPrice]);

  const minInvalid = minRaw.trim() !== '' && parseAmount(minRaw) === undefined;
  const maxInvalid = maxRaw.trim() !== '' && parseAmount(maxRaw) === undefined;

  const commitPrice = (): void => {
    if (minInvalid || maxInvalid) return;
    let lo = parseAmount(minRaw);
    let hi = parseAmount(maxRaw);
    if (lo !== undefined && hi !== undefined && lo > hi) {
      [lo, hi] = [hi, lo];
      setSwapped(true);
    } else {
      setSwapped(false);
    }
    const unchanged =
      lo === draft.minPrice && hi === draft.maxPrice;
    if (!unchanged) {
      onChangeDraft({ ...draft, minPrice: lo, maxPrice: hi });
    }
  };

  const toggleBrand = (name: string): void => {
    const next = draft.brands.includes(name)
      ? draft.brands.filter(b => b !== name)
      : [...draft.brands, name];
    onChangeDraft({ ...draft, brands: next });
  };

  const priceHint = useMemo(() => {
    if (!facets || facets.price.max <= 0) return null;
    return `${formatCurrency(facets.price.min, currency)} – ${formatCurrency(facets.price.max, currency)}`;
  }, [facets, currency]);

  return (
    <View style={styles.container}>
      {/* --- sort ------------------------------------------------------- */}
      <View style={styles.section}>
        <AppText variant="label" color={colors.textSecondary}>
          {strings.filterSort}
        </AppText>
        <View style={styles.sortRow}>
          {SORT_OPTIONS.map(option => {
            const selected = draft.sort === option;
            return (
              <Pressable
                key={option}
                onPress={() => onChangeDraft({ ...draft, sort: option })}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={SORT_LABELS[option]}
                style={[styles.sortChip, selected ? styles.sortChipSelected : null]}
              >
                <AppText
                  variant="caption"
                  color={selected ? colors.textInverse : colors.textPrimary}
                >
                  {SORT_LABELS[option]}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* --- price ------------------------------------------------------ */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <AppText variant="label" color={colors.textSecondary}>
            {strings.filterPrice}
          </AppText>
          {priceHint ? (
            <AppText variant="caption" color={colors.textSecondary}>
              {priceHint}
            </AppText>
          ) : null}
        </View>
        <View style={styles.priceRow}>
          <View style={styles.priceField}>
            <AppInput
              label={strings.filterMinPrice}
              value={minRaw}
              onChangeText={setMinRaw}
              onBlur={commitPrice}
              placeholder="0"
              keyboardType="numeric"
              accessibilityLabel={strings.filterMinPriceA11y}
              errorText={minInvalid ? strings.filterInvalidPrice : undefined}
            />
          </View>
          <View style={styles.priceField}>
            <AppInput
              label={strings.filterMaxPrice}
              value={maxRaw}
              onChangeText={setMaxRaw}
              onBlur={commitPrice}
              placeholder={facets ? String(facets.price.max) : ''}
              keyboardType="numeric"
              accessibilityLabel={strings.filterMaxPriceA11y}
              errorText={maxInvalid ? strings.filterInvalidPrice : undefined}
            />
          </View>
        </View>
        {swapped ? (
          <AppText variant="caption" color={colors.textSecondary}>
            {strings.filterPriceSwapped}
          </AppText>
        ) : null}
      </View>

      {/* --- brands ----------------------------------------------------- */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <AppText variant="label" color={colors.textSecondary}>
            {strings.filterBrand}
          </AppText>
          {draft.brands.length > 0 ? (
            <Pressable
              onPress={() => onChangeDraft({ ...draft, brands: [] })}
              accessibilityRole="button"
              accessibilityLabel={strings.filterClear}
            >
              <AppText variant="caption" color={colors.accent}>
                {strings.filterClear}
              </AppText>
            </Pressable>
          ) : null}
        </View>

        {facetsLoading ? (
          <View style={styles.brandList}>
            {[0, 1, 2, 3].map(index => (
              <Skeleton key={index} style={styles.brandSkeleton} />
            ))}
          </View>
        ) : facets && facets.brands.length > 0 ? (
          <ScrollView
            style={styles.brandScroll}
            nestedScrollEnabled
            showsVerticalScrollIndicator={false}
          >
            {facets.brands.map(brand => {
              const selected = draft.brands.includes(brand.name);
              return (
                <Pressable
                  key={brand.name}
                  onPress={() => toggleBrand(brand.name)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: selected }}
                  accessibilityLabel={`${brand.name}, ${brand.count} ${strings.productCountLabel}`}
                  style={styles.brandRow}
                >
                  <View style={[styles.checkbox, selected ? styles.checkboxSelected : null]}>
                    {selected ? (
                      <AppText variant="caption" color={colors.textInverse}>
                        {'✓'}
                      </AppText>
                    ) : null}
                  </View>
                  <AppText variant="bodySmall" style={styles.brandName}>
                    {brand.name}
                  </AppText>
                  <AppText variant="caption" color={colors.textSecondary}>
                    {brand.count}
                  </AppText>
                </Pressable>
              );
            })}
          </ScrollView>
        ) : (
          <AppText variant="caption" color={colors.textSecondary}>
            {strings.filterBrandsUnavailable}
          </AppText>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: spacing.md,
  },
  section: {
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sortRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  sortChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 36,
    justifyContent: 'center',
  },
  sortChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  priceRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  priceField: {
    flex: 1,
  },
  brandScroll: {
    maxHeight: 220,
  },
  brandList: {
    gap: spacing.sm,
  },
  brandSkeleton: {
    height: 32,
    borderRadius: radius.sm,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 44,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  brandName: {
    flex: 1,
  },
});
