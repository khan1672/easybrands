import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppImage, AppText } from '@components/ui';
import { colors } from '@theme/colors';
import { radius } from '@theme/radius';
import { spacing } from '@theme/spacing';
import { formatCurrency, hasValidPrice } from '@utils/formatCurrency';
import { strings } from '@utils/strings';
import type { SuggestedProduct } from '@services/api/chatApi';

interface SuggestedProductCardProps {
  product: SuggestedProduct;
  onPress: (product: SuggestedProduct) => void;
}

/**
 * A product the assistant recommended.
 *
 * Renders the server's catalogue record rather than anything the model wrote,
 * so the brand, price and image are the real ones. Unpublished prices read as
 * unavailable instead of showing a zero.
 */
export const SuggestedProductCard: React.FC<SuggestedProductCardProps> = ({
  product,
  onPress,
}) => {
  const priceKnown = product.price !== null && hasValidPrice(product.price);

  return (
    <Pressable
      onPress={() => onPress(product)}
      accessibilityRole="button"
      accessibilityLabel={[
        product.brand,
        product.name,
        priceKnown
          ? formatCurrency(product.price as number, product.currency)
          : strings.priceUnavailable,
      ]
        .filter(part => part !== '')
        .join(', ')}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.thumb}>
        {product.imageUrl ? (
          <AppImage
            uri={product.imageUrl}
            style={styles.image}
            accessibilityLabel={product.name}
          />
        ) : null}
      </View>
      <View style={styles.info}>
        {product.brand !== '' ? (
          <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
            {product.brand}
          </AppText>
        ) : null}
        <AppText variant="bodySmall" numberOfLines={2}>
          {product.name}
        </AppText>
        {priceKnown ? (
          <AppText variant="buttonSmall">
            {formatCurrency(product.price as number, product.currency)}
          </AppText>
        ) : (
          <AppText variant="caption" color={colors.textSecondary}>
            {strings.priceUnavailable}
          </AppText>
        )}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  pressed: {
    opacity: 0.6,
  },
  thumb: {
    width: 64,
    height: 80,
    borderRadius: radius.sm,
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  info: {
    flex: 1,
    gap: 2,
  },
});

export default SuggestedProductCard;
