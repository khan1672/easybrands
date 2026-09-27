import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@components/ui';
import { colors } from '@theme/colors';
import { radius } from '@theme/radius';
import { spacing } from '@theme/spacing';
import { strings } from '@utils/strings';
import type { ProductVariant } from '@typings/product';

interface SizeSelectorProps {
  variants: ProductVariant[];
  selectedSku: string | null;
  onSelect: (variant: ProductVariant) => void;
}

/**
 * Sizes as always-visible buttons, never a dropdown: a hidden list makes a
 * shopper open a menu to discover whether their size exists. Unavailable sizes
 * stay visible with a strikethrough so the range reads as "X-Small through
 * X-Large, some gone" rather than silently shrinking.
 */
export const SizeSelector: React.FC<SizeSelectorProps> = ({ variants, selectedSku, onSelect }) => {
  if (variants.length === 0) {
    return null;
  }

  return (
    <View style={styles.grid}>
      {variants.map(variant => {
        const selected = variant.sku !== undefined && variant.sku === selectedSku;
        return (
          <Pressable
            key={variant.sku ?? variant.title}
            onPress={() => onSelect(variant)}
            disabled={!variant.available}
            accessibilityRole="radio"
            accessibilityState={{ selected, disabled: !variant.available }}
            accessibilityLabel={
              variant.available
                ? variant.title
                : `${variant.title}, ${strings.productSizeUnavailable}`
            }
            style={[
              styles.size,
              selected ? styles.sizeSelected : null,
              !variant.available ? styles.sizeUnavailable : null,
            ]}
          >
            <AppText
              variant="buttonSmall"
              color={selected ? colors.textInverse : colors.textPrimary}
              style={!variant.available ? styles.struckThrough : undefined}
            >
              {variant.title}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  size: {
    minWidth: 72,
    minHeight: 44,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  sizeSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  sizeUnavailable: {
    backgroundColor: colors.background,
    borderColor: colors.borderLight,
  },
  struckThrough: {
    textDecorationLine: 'line-through',
    color: colors.textSecondary,
  },
});
