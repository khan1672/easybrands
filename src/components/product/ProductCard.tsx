import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppImage, AppText } from '@components/ui';
import { colors } from '@theme/colors';
import { dimensions } from '@theme/dimensions';
import { radius } from '@theme/radius';
import { spacing } from '@theme/spacing';
import { formatCurrency, formatDiscountPercent } from '@utils/formatCurrency';
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
  const discountPercent =
    product.compareAtPrice !== undefined
      ? formatDiscountPercent(product.price, product.compareAtPrice)
      : 0;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? `${product.name}, ${formatCurrency(product.price)}`}
      style={({ pressed }) => [styles.root, pressed && styles.pressed]}
    >
      <View style={styles.imageContainer}>
        <AppImage
          uri={product.images[0].url}
          style={styles.image}
          accessibilityLabel={product.images[0].alt}
        />
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
          <AppText variant="buttonSmall">{formatCurrency(product.price)}</AppText>
          {product.compareAtPrice !== undefined ? (
            <AppText
              variant="caption"
              color={colors.textSecondary}
              style={styles.compareAt}
            >
              {formatCurrency(product.compareAtPrice)}
            </AppText>
          ) : null}
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