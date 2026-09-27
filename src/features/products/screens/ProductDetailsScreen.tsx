import React, { useCallback, useMemo, useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppButton, AppText } from '@components/ui';
import { ErrorState, Skeleton } from '@components/feedback';
import { ProductGallery } from '@features/products/components/ProductGallery';
import { SizeSelector } from '@features/products/components/SizeSelector';
import { useProductDetails } from '@features/products/queries/useProductDetails';
import { track } from '@services/analytics';
import { colors } from '@theme/colors';
import { radius } from '@theme/radius';
import { spacing } from '@theme/spacing';
import { strings } from '@utils/strings';
import { formatCurrency, hasValidPrice } from '@utils/formatCurrency';
import type { RootStackParamList } from '@navigation/RootNavigator';
import type { ProductVariant } from '@typings/product';

type Props = NativeStackScreenProps<RootStackParamList, 'ProductDetails'>;

const DetailSkeleton: React.FC = () => (
  <View style={styles.skeleton}>
    <Skeleton style={styles.skeletonHero} />
    <Skeleton style={styles.skeletonLine} />
    <Skeleton style={styles.skeletonLineShort} />
    <Skeleton style={styles.skeletonBlock} />
  </View>
);

/**
 * Everything the catalogue actually knows about one product: imagery, brand,
 * price, sizes with real stock flags, the merchant description, and a link to
 * the brand's own storefront where the purchase completes.
 *
 * There is no cart or checkout in the app yet, so the primary action opens the
 * brand site rather than a dead "Add to Bag" button.
 */
export const ProductDetailsScreen: React.FC<Props> = ({ route }) => {
  const { slug, source } = route.params;
  const insets = useSafeAreaInsets();
  const { data: product, isLoading, isError, refetch } = useProductDetails(slug);

  // Default to the only size a shopper can actually buy, so a single-size
  // product does not make them tap a button before the CTA becomes usable.
  const firstAvailable = useMemo(
    () => product?.variants.find(v => v.available)?.sku ?? null,
    [product],
  );
  const [selectedSku, setSelectedSku] = useState<string | null>(firstAvailable);

  const selectedVariant: ProductVariant | undefined = useMemo(
    () => product?.variants.find(v => v.sku !== undefined && v.sku === selectedSku),
    [product, selectedSku],
  );

  const handleSelectSize = useCallback(
    (variant: ProductVariant): void => {
      setSelectedSku(variant.sku ?? null);
      track('size_selected', {
        product_id: product?.id,
        size: variant.title,
        source: source ?? 'unknown',
      });
    },
    [product?.id, source],
  );

  const handleOpenBrand = useCallback(async (): Promise<void> => {
    const url = product?.productUrl ?? product?.brandWebsite;
    if (!url) {
      Alert.alert(strings.errorTitle, strings.productBrandSiteMissing);
      return;
    }
    if (selectedVariant === undefined && product?.variants.some(v => v.available)) {
      // Buying a specific size matters, so say so instead of failing silently
      // on the brand site.
      Alert.alert(strings.productSize, strings.productSelectSizeFirst);
      return;
    }
    try {
      await Linking.openURL(url);
      track('product_image_viewed', { product_id: product?.id, source: source ?? 'unknown' });
    } catch {
      Alert.alert(strings.errorTitle, strings.productBrandSiteMissing);
    }
  }, [product, selectedVariant, source]);

  if (isLoading) {
    return (
      <View style={styles.root}>
        <DetailSkeleton />
      </View>
    );
  }

  if (isError || product === null || product === undefined) {
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

  // A size can carry its own price; prefer it over the parent price when present.
  const effectivePrice =
    selectedVariant?.price !== undefined ? selectedVariant.price : product.price;
  const priceKnown = hasValidPrice(effectivePrice);
  const spokenPrice = priceKnown
    ? formatCurrency(effectivePrice, product.currency)
    : strings.productPriceUnavailable;
  const hasSizes = product.variants.length > 0;
  const inStock = product.available;

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: spacing.xxxl + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        <ProductGallery images={product.images} productName={product.name} />

        <View style={styles.body}>
          {product.brandName !== '' ? (
            <AppText variant="label" color={colors.textSecondary}>
              {product.brandName}
            </AppText>
          ) : null}
          <AppText variant="heading3">{product.name}</AppText>

          <View style={styles.priceRow}>
            <AppText variant="heading2">{spokenPrice}</AppText>
            {product.compareAtPrice !== undefined && priceKnown ? (
              <AppText variant="bodySmall" color={colors.textSecondary} style={styles.compareAt}>
                {formatCurrency(product.compareAtPrice, product.currency)}
              </AppText>
            ) : null}
          </View>

          <View style={styles.stockRow}>
            <View
              style={[styles.stockDot, { backgroundColor: inStock ? colors.success : colors.error }]}
            />
            <AppText variant="bodySmall" color={colors.textSecondary}>
              {inStock ? strings.productInStock : strings.productOutOfStock}
            </AppText>
          </View>

          {hasSizes ? (
            <View style={styles.section}>
              <AppText variant="label" color={colors.textSecondary}>
                {strings.productSize}
              </AppText>
              <SizeSelector
                variants={product.variants}
                selectedSku={selectedSku}
                onSelect={handleSelectSize}
              />
              {selectedVariant !== undefined ? (
                <AppText variant="caption" color={colors.textSecondary}>
                  {selectedVariant.sku !== undefined
                    ? `${strings.productSize}: ${selectedVariant.title}`
                    : ''}
                </AppText>
              ) : null}
            </View>
          ) : null}

          <View style={styles.section}>
            <AppText variant="label" color={colors.textSecondary}>
              {strings.productDescription}
            </AppText>
            <AppText variant="bodySmall">
              {product.description ?? strings.productNoDescription}
            </AppText>
          </View>
        </View>
      </ScrollView>

      {/* Sticky purchase bar: price stays visible with the action in thumb reach. */}
      <View style={[styles.purchaseBar, { paddingBottom: spacing.md + insets.bottom }]}>
        <AppText variant="buttonSmall" style={styles.purchasePrice}>
          {spokenPrice}
        </AppText>
        <View style={styles.purchaseButton}>
          <AppButton
            label={strings.productViewOnBrand}
            onPress={() => {
              handleOpenBrand().catch(() => undefined);
            }}
            disabled={!inStock}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: spacing.xxxl,
  },
  body: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  compareAt: {
    textDecorationLine: 'line-through',
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  stockDot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
  },
  section: {
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  purchaseBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  purchasePrice: {
    flexShrink: 1,
  },
  purchaseButton: {
    flex: 1,
  },
  skeleton: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  skeletonHero: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: radius.xl,
  },
  skeletonLine: {
    height: 20,
    width: '70%',
  },
  skeletonLineShort: {
    height: 16,
    width: '45%',
  },
  skeletonBlock: {
    height: 120,
    width: '100%',
  },
});
