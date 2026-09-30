import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FlashList, type FlashListRef } from '@shopify/flash-list';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppText } from '@components/ui';
import { ProductCard } from '@components/product';
import { EmptyState, ErrorState, Skeleton } from '@components/feedback';
import { BrandCategoryRail } from '@features/brands/components/BrandCategoryRail';
import { useBrandFacets, useBrandProducts } from '@features/brands/queries/useBrandProducts';
import { track } from '@services/analytics';
import { colors } from '@theme/colors';
import { radius } from '@theme/radius';
import { spacing } from '@theme/spacing';
import { strings } from '@utils/strings';
import type { RootStackParamList } from '@navigation/RootNavigator';
import type { Product } from '@typings/product';

type Props = NativeStackScreenProps<RootStackParamList, 'Brand'>;

const BrandSkeleton: React.FC = () => (
  <View style={styles.skeletonGrid}>
    {Array.from({ length: 6 }, (_, index) => (
      <View key={index} style={styles.skeletonCard}>
        <Skeleton style={styles.skeletonImage} />
        <Skeleton style={styles.skeletonLine} />
        <Skeleton style={styles.skeletonLineShort} />
      </View>
    ))}
  </View>
);

/**
 * Every in-stock product from one brand, reached by tapping the brand name on a
 * product page.
 *
 * The brand is the merchant's own name string rather than an id, so the header
 * shows exactly the name the shopper tapped and no mapping table can drift out
 * of sync with the catalogue.
 */
export const BrandScreen: React.FC<Props> = ({ route, navigation }) => {
  const { brand } = route.params;
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlashListRef<Product>>(null);
  const hasTracked = useRef(false);
  // Canonical category name, or undefined for "All".
  const [category, setCategory] = useState<string | undefined>(undefined);

  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useBrandProducts(brand, category);
  const { data: facets } = useBrandFacets(brand);

  const products = useMemo<Product[]>(
    () => data?.pages.flatMap(page => page.items) ?? [],
    [data],
  );
  const total = data?.pages[0]?.total ?? 0;

  useEffect(() => {
    if (hasTracked.current) {
      return;
    }
    hasTracked.current = true;
    track('brand_viewed', { brand, source: 'product_details' });
  }, [brand]);

  const handleProductPress = useCallback(
    (product: Product): void => {
      track('product_viewed', {
        product_id: product.id,
        brand,
        price: product.price,
        source: 'brand',
      });
      navigation.navigate('ProductDetails', { slug: product.id, source: 'brand' });
    },
    [brand, navigation],
  );

  const handleCategorySelect = useCallback((next: string | undefined): void => {
    setCategory(next);
    // A new category is a new result set, so start it from the top.
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, []);

  const handleEndReached = useCallback((): void => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage().catch(() => undefined);
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const renderItem = useCallback(
    ({ item }: { item: Product }) => (
      <View style={styles.cell}>
        <ProductCard product={item} onPress={() => handleProductPress(item)} />
      </View>
    ),
    [handleProductPress],
  );

  // Pinned above the grid rather than placed in the list header: a shopper who
  // lands on an empty category must still be able to switch category.
  const rail = useMemo(
    () => (
      <BrandCategoryRail
        categories={facets?.categories ?? []}
        selected={category}
        onSelect={handleCategorySelect}
      />
    ),
    [category, facets?.categories, handleCategorySelect],
  );

  const header = useMemo(
    () => (
      <View style={styles.header}>
        <AppText variant="heading3" numberOfLines={1} style={styles.headerName}>
          {brand}
        </AppText>
        {!isLoading && !isError ? (
          <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
            {strings.brandProductCount(total)}
          </AppText>
        ) : null}
      </View>
    ),
    [brand, isError, isLoading, total],
  );

  const showSkeleton = isLoading && products.length === 0;
  const showError = isError && products.length === 0;
  const showEmpty = !isLoading && !isError && products.length === 0;

  return (
    <View style={styles.root}>
     {rail}
      {showSkeleton ? <BrandSkeleton /> : null}

      {showError ? (
        <ErrorState
          title={strings.brandErrorTitle}
          message={strings.errorMessage}
          ctaLabel={strings.errorCta}
          onRetry={() => {
            refetch().catch(() => undefined);
          }}
        />
      ) : null}

      {showEmpty ? (
        <EmptyState
          title={category === undefined ? strings.brandEmptyTitle : strings.brandCategoryEmptyTitle}
          message={category === undefined ? strings.brandEmptyMessage : strings.brandCategoryEmptyMessage}
          ctaLabel={category === undefined ? strings.brandEmptyCta : strings.brandCategoryEmptyCta}
          onCtaPress={
            category === undefined
              ? () => navigation.goBack()
              : () => handleCategorySelect(undefined)
          }
        />
      ) : null}

      {products.length > 0 ? (
        <FlashList<Product>
          ref={listRef}
          data={products}
          numColumns={2}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          ListHeaderComponent={header}
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={styles.footer}>
                <Skeleton style={styles.footerLine} />
              </View>
            ) : (
              <View style={styles.footer}>
                <AppText variant="bodySmall" color={colors.textSecondary} style={styles.footerText}>
                  {strings.brandEndOfResults}
                </AppText>
              </View>
            )
          }
          contentContainerStyle={[styles.listContent, { paddingBottom: spacing.xxxl + insets.bottom }]}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.6}
          accessibilityLabel={strings.brandResultsLabel(brand)}
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    // One line: the brand name and its count sit side by side, so this block
    // costs a single text height instead of two lines and a gap. The section
    // above the products should not grow just to repeat the brand name.
    paddingTop: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  headerName: {
    // Takes the slack so a long brand name truncates instead of the count.
    flexShrink: 1,
  },
  listContent: {
    paddingHorizontal: spacing.sm,
  },
  cell: {
    flex: 1,
    padding: spacing.md,
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
    aspectRatio: 0.78,
    borderRadius: radius.md,
  },
  skeletonLine: {
    height: 12,
    marginTop: spacing.sm,
  },
  skeletonLineShort: {
    height: 12,
    width: '55%',
    marginTop: spacing.xs,
  },
  footer: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  footerText: {
    textAlign: 'center',
  },
  footerLine: {
    height: 14,
    width: '45%',
    alignSelf: 'center',
  },
});
