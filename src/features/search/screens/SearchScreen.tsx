import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FlashList, type FlashListRef } from '@shopify/flash-list';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppInput, AppText } from '@components/ui';
import { ProductCard } from '@components/product';
import { EmptyState, ErrorState, Skeleton } from '@components/feedback';
import { useDebouncedValue } from '@hooks/useDebouncedValue';
import { isSearchableQuery, useProductSearch } from '@features/search/queries/useProductSearch';
import { track } from '@services/analytics';
import { colors } from '@theme/colors';
import { radius } from '@theme/radius';
import { spacing } from '@theme/spacing';
import { strings } from '@utils/strings';
import type { RootStackParamList } from '@navigation/RootNavigator';
import type { Product } from '@typings/product';

type Props = NativeStackScreenProps<RootStackParamList, 'Search'>;

/** Long enough to avoid a request per keystroke, short enough to feel live. */
const INPUT_DEBOUNCE_MS = 300;

const SearchSkeleton: React.FC = () => (
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
 * Catalogue search across product name, brand name, tags, category and
 * description; ranking is done by the API.
 *
 * The query is debounced before it reaches the cache, and each keystroke is a
 * distinct query key, so refining a search can never show a mix of two result
 * sets. Delisted products are already excluded by the API.
 */
export const SearchScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, INPUT_DEBOUNCE_MS);
  const listRef = useRef<FlashListRef<Product>>(null);
  const hasTrackedStart = useRef(false);

  const {
    data,
    isLoading,
    isError,
    isFetching,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useProductSearch(debouncedQuery);

  const isSearchable = isSearchableQuery(debouncedQuery);
  const products = useMemo<Product[]>(
    () => data?.pages.flatMap(page => page.items) ?? [],
    [data],
  );
  const total = data?.pages[0]?.total ?? 0;
  // True while a refetch is running for an already-populated result set, which
  // must not blank out results that are already on screen.
  const isRefreshing = isFetching && !isLoading && products.length > 0;

  useEffect(() => {
    if (!isSearchable || hasTrackedStart.current) {
      return;
    }
    hasTrackedStart.current = true;
    track('search_started', { source: 'home' });
  }, [isSearchable]);

  useEffect(() => {
    if (!isSearchable || isLoading || isError) {
      return;
    }
    track('search_completed', { query: debouncedQuery, result_count: total, source: 'home' });
  }, [debouncedQuery, isError, isLoading, isSearchable, total]);

  const handleChange = useCallback((next: string): void => {
    setQuery(next);
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, []);

  const handleClear = useCallback((): void => {
    setQuery('');
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, []);

  const handleEndReached = useCallback((): void => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage().catch(() => undefined);
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const handleProductPress = useCallback(
    (product: Product): void => {
      track('product_viewed', {
        product_id: product.id,
        price: product.price,
        source: 'search',
        query: debouncedQuery,
      });
      navigation.navigate('ProductDetails', { slug: product.id, source: 'search' });
    },
    [debouncedQuery, navigation],
  );

  const renderItem = useCallback(
    ({ item }: { item: Product }) => (
      <View style={styles.cell}>
        <ProductCard product={item} onPress={() => handleProductPress(item)} />
      </View>
    ),
    [handleProductPress],
  );

  const listFooter = useMemo(() => {
    if (isFetchingNextPage) {
      return (
        <View style={styles.footer}>
          <Skeleton style={styles.footerLine} />
        </View>
      );
    }
    if (products.length > 0 && !hasNextPage) {
      return (
        <View style={styles.footer}>
          <AppText variant="bodySmall" color={colors.textSecondary} style={styles.footerText}>
            {strings.searchEndOfResults}
          </AppText>
        </View>
      );
    }
    return null;
  }, [hasNextPage, isFetchingNextPage, products.length]);

  const showSkeleton = isSearchable && isLoading && products.length === 0;
  const showEmpty = isSearchable && !isLoading && !isError && products.length === 0;
  const showError = isSearchable && isError && products.length === 0;
  const showPrompt = !isSearchable;

  return (
    <View style={styles.root}>
      <View style={styles.inputRow}>
        <AppInput
          value={query}
          onChangeText={handleChange}
          placeholder={strings.searchPlaceholder}
          accessibilityLabel={strings.searchAccessibilityLabel}
          autoFocus
        />
        {query.length > 0 ? (
          <Pressable
            onPress={handleClear}
            accessibilityRole="button"
            accessibilityLabel={strings.searchClearLabel}
            hitSlop={8}
            style={({ pressed }) => [styles.clear, pressed && styles.pressed]}
          >
            <AppText variant="bodySmall" color={colors.textSecondary}>
              {strings.searchClear}
            </AppText>
          </Pressable>
        ) : null}
      </View>

      {showPrompt ? (
        <View style={styles.centered}>
          <AppText variant="bodySmall" color={colors.textSecondary} style={styles.centeredText}>
            {strings.searchPrompt}
          </AppText>
        </View>
      ) : null}

      {showSkeleton ? <SearchSkeleton /> : null}

      {showError ? (
        <ErrorState
          title={strings.searchErrorTitle}
          message={strings.searchErrorMessage}
          ctaLabel={strings.errorCta}
          onRetry={() => {
            refetch().catch(() => undefined);
          }}
        />
      ) : null}

      {showEmpty ? (
        <EmptyState
          title={strings.searchEmptyTitle}
          message={strings.searchEmptyMessage}
          ctaLabel={strings.searchClear}
          onCtaPress={handleClear}
        />
      ) : null}

      {products.length > 0 ? (
        <FlashList<Product>
          ref={listRef}
          data={products}
          numColumns={2}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          ListFooterComponent={listFooter}
          contentContainerStyle={[styles.listContent, { paddingBottom: spacing.xxxl + insets.bottom }]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.6}
          accessibilityLabel={strings.searchResultsLabel(total)}
        />
      ) : null}

      {isRefreshing ? (
        <View style={styles.refreshing} accessibilityLabel={strings.searchUpdating}>
          <AppText variant="bodySmall" color={colors.textSecondary}>
            {strings.searchUpdating}
          </AppText>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  clear: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.6,
  },
  listContent: {
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.md,
  },
  cell: {
    flex: 1,
    padding: spacing.md,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  centeredText: {
    textAlign: 'center',
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
  refreshing: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
  },
});
