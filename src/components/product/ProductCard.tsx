import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppImage, AppText } from '@components/ui';
import { colors } from '@theme/colors';
import { dimensions } from '@theme/dimensions';
import { radius } from '@theme/radius';
import { spacing } from '@theme/spacing';
import { formatCurrency, formatDiscountPercent, hasValidPrice } from '@utils/formatCurrency';
import { getPrimaryImage } from '@utils/getPrimaryImage';
import { strings } from '@utils/strings';
import { Product } from '@typings/product';

interface ProductCardProps {
  product: Product;
  onPress: () => void;
  accessibilityLabel?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onPress,
  accessibilityLabel,
}) => {
  const priceKnown = hasValidPrice(product.price);
  // Scraper data can omit imagery entirely, so never index `images` directly.
  const primaryImage = getPrimaryImage(product);
  const discountPercent =
    priceKnown && product.compareAtPrice !== undefined
      ? formatDiscountPercent(product.price, product.compareAtPrice)
      : 0;
  const spokenPrice = priceKnown
    ? formatCurrency(product.price, product.currency)
    : strings.priceUnavailable;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? `${product.name}, ${spokenPrice}`}
      style={({ pressed }) => [styles.root, pressed && styles.pressed]}
    >
      <View style={styles.imageContainer}>
        {primaryImage ? (
          <AppImage
            uri={primaryImage.url}
            style={styles.image}
            accessibilityLabel={primaryImage.alt}
          />
        ) : null}
        {discountPercent > 0 ? (
          <View style={styles.discountBadge}>
            <AppText variant="caption" color={colors.textInverse}>
              {discountPercent}% {strings.discountBadge}
            </AppText>
          </View>
        ) : null}
        {product.isNew ? (
          <View style={styles.newBadge}>
            <AppText variant="caption" color={colors.textPrimary}>
              {strings.newArrivalsLabel}
            </AppText>
          </View>
        ) : null}
      </View>
      <View style={styles.info}>
        <AppText variant="bodySmall" numberOfLines={2}>
          {product.name}
        </AppText>
        <View style={styles.ratingRow}>
          <AppText variant="caption" color={colors.textSecondary}>
            {strings.ratingSymbol} {product.rating.toFixed(1)} ({product.reviewCount})
          </AppText>
        </View>
        <View style={styles.priceRow}>
          {priceKnown ? (
            <>
              <AppText variant="buttonSmall">{formatCurrency(product.price, product.currency)}</AppText>
              {product.compareAtPrice !== undefined ? (
                <AppText
                  variant="caption"
                  color={colors.textSecondary}
                  style={styles.compareAt}
                >
                  {formatCurrency(product.compareAtPrice, product.currency)}
                </AppText>
              ) : null}
            </>
          ) : (
            <AppText variant="caption" color={colors.textSecondary}>
              {strings.priceUnavailable}
            </AppText>
          )}
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  pressed: {
    opacity: 0.7,
  },
  imageContainer: {
    aspectRatio: dimensions.productImageAspectRatio,
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.skeleton,
  },
  image: {
    flex: 1,
    width: '100%',
  },
  discountBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  newBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  info: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  ratingRow: {
    marginTop: spacing.xs,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    gap: spacing.sm,
  },
  compareAt: {
    textDecorationLine: 'line-through',
  },
});