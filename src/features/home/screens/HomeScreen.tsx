import React, { useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppText } from '@components/ui';
import { ProductCard } from '@components/product';
import { EmptyState, ErrorState, Skeleton } from '@components/feedback';
import { HomeHeader } from '@features/home/components/HomeHeader';
import { HeroBannerView } from '@features/home/components/HeroBanner';
import { CategoryRow } from '@features/home/components/CategoryRow';
import { useHomeFeed } from '@features/home/queries/useHomeFeed';
import { track } from '@services/analytics';
import { colors } from '@theme/colors';
import { spacing } from '@theme/spacing';
import { dimensions } from '@theme/dimensions';
import { strings } from '@utils/strings';
import type { RootStackParamList } from '@navigation/RootNavigator';
import { Category } from '@typings/category';
import { Product } from '@typings/product';

const HomeSkeleton: React.FC<{ topInset: number; bottomInset: number }> = ({
  topInset,
  bottomInset,
}) => {
  const insetStyles = useMemo(
    () =>
      StyleSheet.create({
        header: { paddingTop: topInset },
        body: { paddingBottom: bottomInset },
      }),
    [topInset, bottomInset],
  );
  return (
    <View style={styles.root}>
      <View style={insetStyles.header}>
        <HomeHeader />
      </View>
      <View style={[styles.skeletonBody, insetStyles.body]}>
      <Skeleton style={styles.skeletonHero} />
      <View style={styles.skeletonGrid}>
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
    </View>
  </View>
  );
};

const HomeErrorState: React.FC<{ onRetry: () => void; topInset: number }> = ({
  onRetry,
  topInset,
}) => {
  const insetStyles = useMemo(
    () => StyleSheet.create({ header: { paddingTop: topInset } }),
    [topInset],
  );
  return (
    <View style={styles.root}>
      <View style={insetStyles.header}>
        <HomeHeader />
      </View>
      <ErrorState
        title={strings.errorTitle}
        message={strings.errorMessage}
        ctaLabel={strings.errorCta}
        onRetry={onRetry}
      />
    </View>
  );
};

type HomeScreenProps = NativeStackScreenProps<RootStackParamList, 'Main'>;

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { hero, categories, products, isLoading, isError, refetchAll } = useHomeFeed();
  const hasTrackedHome = useRef(false);
  // Home renders with headerShown: false, so it is responsible for its own top
  // inset (status bar / notch) as well as the bottom one. Read before the early
  // returns below to keep the hook order stable.
  const insets = useSafeAreaInsets();
  const insetStyles = useMemo(
    () =>
      StyleSheet.create({
        header: { paddingTop: insets.top },
        listContent: { paddingBottom: spacing.xxxl + insets.bottom },
      }),
    [insets.top, insets.bottom],
  );

  useEffect(() => {
    if (hasTrackedHome.current) {
      return;
    }
    hasTrackedHome.current = true;
    track('home_viewed', { source: 'tab' });
  }, []);

  if (isLoading) {
    return <HomeSkeleton topInset={insets.top} bottomInset={insets.bottom} />;
  }

  if (isError || hero === undefined || categories === undefined || products === undefined) {
    return <HomeErrorState onRetry={refetchAll} topInset={insets.top} />;
  }

  const handleProductPress = (product: Product): void => {
    track('product_viewed', {
      product_id: product.id,
      category: product.categoryId,
      price: product.price,
      source: 'home',
    });
  };

  const handleCategoryPress = (category: Category): void => {
    track('category_viewed', { category: category.name, category_id: category.id, source: 'home' });
    navigation.navigate('CategoryProducts', { category: category.name, title: category.name });
  };

  const handleHeroCtaPress = (): void => {
    track('collection_viewed', { id: hero.id, source: 'home' });
  };

  return (
    <View style={styles.root}>
      <View style={insetStyles.header}>
        <HomeHeader />
      </View>
      <FlashList<Product>
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
            <View style={styles.heroWrapper}>
              <HeroBannerView banner={hero} onCtaPress={handleHeroCtaPress} />
            </View>
            <AppText variant="heading3" style={styles.sectionTitle}>
              {strings.shopByCategory}
            </AppText>
            <CategoryRow categories={categories} onPress={handleCategoryPress} />
            <AppText variant="heading3" style={styles.sectionTitle}>
              {strings.newArrivals}
            </AppText>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            title={strings.emptyTitle}
            message={strings.emptyMessage}
            ctaLabel={strings.emptyCta}
            onCtaPress={refetchAll}
          />
        }
        contentContainerStyle={[styles.listContent, insetStyles.listContent]}
        showsVerticalScrollIndicator={false}
      />
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
    paddingHorizontal: spacing.md,
  },
  cell: {
    flex: 1,
    padding: spacing.md,
  },
  heroWrapper: {
    marginTop: spacing.sm,
  },
  sectionTitle: {
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  skeletonBody: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  skeletonHero: {
    aspectRatio: dimensions.bannerAspectRatio,
    borderRadius: 24,
  },
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
    marginTop: spacing.xl,
  },
  skeletonCard: {
    width: '47%',
  },
  skeletonImage: {
    width: '100%',
    borderRadius: 20,
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