import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FlashList, type FlashListRef } from '@shopify/flash-list';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppBottomSheet, AppButton, AppText } from '@components/ui';
import { ProductCard } from '@components/product';
import { EmptyState, ErrorState, Skeleton } from '@components/feedback';
import { FilterPanel } from '@features/categories/components/FilterPanel';
import {
  useCategoryFacets,
  useCategoryProducts,
} from '@features/categories/queries/useCategoryProducts';
import { useCategoryFilterStore } from '@store/useCategoryFilterStore';
import { track } from '@services/analytics';
import { colors } from '@theme/colors';
import { radius } from '@theme/radius';
import { spacing } from '@theme/spacing';
import { dimensions } from '@theme/dimensions';
import { strings } from '@utils/strings';
import type { RootStackParamList } from '@navigation/RootNavigator';
import type { Product } from '@typings/product';
import { activeFilterCount, type CategoryFilters } from '@typings/filters';

type Props = NativeStackScreenProps<RootStackParamList, 'CategoryProducts'>;

const CategorySkeleton: React.FC<{ bottomInset: number }> = ({ bottomInset }) => {
  const insetStyles = React.useMemo(
    () => StyleSheet.create({ root: { paddingBottom: bottomInset } }),
    [bottomInset],
  );
  return (
    <View style={[styles.skeletonGrid, insetStyles.root]}>
      {Array.from({ length: 6 }, (_, index) => (
        <View key={index} style={styles.skeletonCard}>
          <Skeleton
            style={[styles.skeletonImage, { aspectRatio: dimensions.productImageAspectRatio }]}
          />
          <Skeleton style={styles.skeletonLine} />
          <Skeleton style={styles.skeletonLineShort} />
        </View>
      ))}
    </View>
  );
};

/**
 * Products in one category, reached by tapping a tile in the home
 * "Shop by Category" rail. Backed by GET /products?category=<name>, which the
 * backend resolves through its canonical taxonomy, so the counts match the
 * rail.
 *
 * Filters are edited in a bottom sheet and only committed on Apply. Because the
 * applied selection is part of the query key, changing a filter refetches from
 * page 1 instead of mixing results from two different result sets.
 */
export const CategoryProductsScreen: React.FC<Props> = ({ route, navigation }) => {
  const { category, title } = route.params;
  // The top inset is handled by the native stack header; the list only needs
  // the bottom one so the last row clears the gesture bar.
  const insets = useSafeAreaInsets();
  const filters = useCategoryFilterStore(state => state.filters);
  const applyFilters = useCategoryFilterStore(state => state.applyFilters);
  const resetFilters = useCategoryFilterStore(state => state.resetFilters);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [draft, setDraft] = useState<CategoryFilters>(filters);

  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useCategoryProducts(category, filters);
  const { data: facets, isLoading: facetsLoading } = useCategoryFacets(category);

  const listRef = useRef<FlashListRef<Product>>(null);
  const hasTrackedView = useRef(false);

  useEffect(() => {
    if (hasTrackedView.current) {
      return;
    }
    hasTrackedView.current = true;
    track('category_viewed', { category: title, category_id: category, source: 'home' });
  }, [category, title]);

  const products = useMemo<Product[]>(
    () => data?.pages.flatMap(page => page.items) ?? [],
    [data],
  );
  const total = data?.pages[0]?.total ?? 0;
  const currency = products[0]?.currency ?? 'PKR';
  const activeCount = activeFilterCount(filters);
  const hasActiveFilters = activeCount > 0;

  const insetStyles = React.useMemo(
    () =>
      StyleSheet.create({
        listContent: { paddingBottom: spacing.xxxl + insets.bottom },
      }),
    [insets.bottom],
  );

  const openSheet = useCallback((): void => {
    setDraft(filters);
    setSheetOpen(true);
  }, [filters]);

  const closeSheet = useCallback((): void => setSheetOpen(false), []);

  const handleApply = useCallback((): void => {
    applyFilters(draft);
    setSheetOpen(false);
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
    track('filters_applied', {
      category,
      source: 'category',
      brand_count: draft.brands.length,
      has_price_range: draft.minPrice !== undefined || draft.maxPrice !== undefined,
      sort: draft.sort,
    });
  }, [applyFilters, category, draft]);

  const handleClear = useCallback((): void => {
    resetFilters();
    setSheetOpen(false);
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [resetFilters]);

  const handleEndReached = useCallback((): void => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage().catch(() => undefined);
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const handleProductPress = useCallback(
    (product: Product): void => {
      track('product_viewed', {
        product_id: product.id,
        category,
        price: product.price,
        source: 'category',
      });
      navigation.navigate('ProductDetails', { slug: product.id, source: 'category' });
    },
    [category, navigation],
  );

  if (isLoading) {
    return (
      <View style={styles.root}>
        <CategorySkeleton bottomInset={insets.bottom} />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.root}>
        <ErrorState
          title={strings.errorTitle}
          message={strings.errorMessage}
          ctaLabel={strings.errorCta}
          onRetry={() => {
            refetch().catch(() => undefined);
          }}
        />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <FlashList<Product>
        ref={listRef}
        data={products}
        numColumns={2}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.cell}>
            <ProductCard product={item} onPress={() => handleProductPress(item)} />
          </View>
        )}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <AppText variant="bodySmall" color={colors.textSecondary}>
              {total} {strings.productCountLabel}
            </AppText>
            <Pressable
              onPress={openSheet}
              accessibilityRole="button"
              accessibilityLabel={
                activeCount > 0
                  ? `${strings.filterButton}, ${activeCount} active`
                  : strings.filterButton
              }
              style={styles.filterButton}
              hitSlop={spacing.sm}
            >
              <AppText variant="buttonSmall">{strings.filterButton}</AppText>
              {activeCount > 0 ? (
                <View style={styles.badge}>
                  <AppText variant="caption" color={colors.textInverse}>
                    {activeCount}
                  </AppText>
                </View>
              ) : null}
            </Pressable>
          </View>
        }
        ListEmptyComponent={
          hasActiveFilters ? (
            <EmptyState
              title={strings.filterEmptyTitle}
              message={strings.filterEmptyMessage}
              ctaLabel={strings.filterClear}
              onCtaPress={handleClear}
            />
          ) : (
            <EmptyState
              title={strings.categoryEmptyTitle}
              message={strings.categoryEmptyMessage}
              ctaLabel={strings.emptyCta}
              onCtaPress={() => {
                refetch().catch(() => undefined);
              }}
            />
          )
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <View style={styles.footer}>
              <Skeleton style={styles.footerLine} />
            </View>
          ) : null
        }
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.6}
        contentContainerStyle={[styles.listContent, insetStyles.listContent]}
        showsVerticalScrollIndicator={false}
      />

      <AppBottomSheet
        visible={sheetOpen}
        title={strings.filterTitle}
        onClose={closeSheet}
        bottomInset={insets.bottom}
        footer={
          <View style={styles.sheetFooter}>
            <View style={styles.sheetFooterButton}>
              <AppButton
                label={strings.filterClear}
                variant="secondary"
                onPress={handleClear}
                labelVariant="buttonMicro"
              />
            </View>
            <View style={styles.sheetFooterButton}>
              <AppButton
                label={strings.filterApply}
                onPress={handleApply}
                labelVariant="buttonMicro"
              />
            </View>
          </View>
        }
      >
        <FilterPanel
          facets={facets}
          facetsLoading={facetsLoading}
          applied={filters}
          draft={draft}
          onChangeDraft={setDraft}
          currency={currency}
        />
      </AppBottomSheet>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    paddingBottom: spacing.xxxl,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 36,
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: radius.full,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  cell: {
    flex: 1,
    padding: spacing.md,
  },
  footer: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  footerLine: {
    height: 14,
    width: '45%',
    alignSelf: 'center',
  },
  sheetFooter: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  sheetFooterButton: {
    flex: 1,
  },
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
    padding: spacing.lg,
  },
  skeletonCard: {
    width: '47%',
  },
  skeletonImage: {
    width: '100%',
  },
  skeletonLine: {
    height: 14,
    marginTop: spacing.md,
    width: '85%',
  },
  skeletonLineShort: {
    height: 14,
    marginTop: spacing.sm,
    width: '55%',
  },
});
