import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { AppText } from '@components/ui';
import { colors } from '@theme/colors';
import { dimensions } from '@theme/dimensions';
import { radius } from '@theme/radius';
import { spacing } from '@theme/spacing';
import { strings } from '@utils/strings';
import type { FacetCategory } from '@typings/filters';

// The chip is drawn shorter than the minimum tap target, so the difference is
// added back as hitSlop: the chip looks compact without shrinking the area a
// finger has to land on.
const CHIP_HIT_SLOP = {
  top: Math.max(0, (dimensions.minTouchTarget - dimensions.filterChipHeight) / 2),
  bottom: Math.max(0, (dimensions.minTouchTarget - dimensions.filterChipHeight) / 2),
  left: 0,
  right: 0,
};

interface BrandCategoryRailProps {
  categories: FacetCategory[];
  /** Canonical category name, or undefined for "All". */
  selected?: string;
  onSelect: (category: string | undefined) => void;
}

/**
 * Horizontal category filter for one brand.
 *
 * Horizontal because these are quick, one-tap refinements: a vertical list would
 * push the product grid below the fold before the shopper saw a single item.
 * The selected chip is marked with `accessibilityState`, not colour alone.
 */
export const BrandCategoryRail: React.FC<BrandCategoryRailProps> = ({
  categories,
  selected,
  onSelect,
}) => {
  // A brand whose products all fall into one bucket (HSY and Sana Safinaz are
  // entirely "Uncategorized") would otherwise show "All" next to that single
  // bucket, i.e. two chips that do the same thing. Fewer than two categories
  // is not worth a filter row.
  if (categories.length < 2) {
    return null;
  }

  return (
    <View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.content}
        accessibilityRole="tablist"
      >
        <Pressable
          onPress={() => onSelect(undefined)}
          accessibilityRole="tab"
          accessibilityState={{ selected: selected === undefined }}
          accessibilityLabel={strings.brandCategoryAll}
          hitSlop={CHIP_HIT_SLOP}
          style={({ pressed }) => [
            styles.chip,
            selected === undefined ? styles.chipSelected : styles.chipIdle,
            pressed && styles.pressed,
          ]}
        >
          <AppText
            variant="caption"
            color={selected === undefined ? colors.textPrimary : colors.textSecondary}
          >
            {strings.brandCategoryAll}
          </AppText>
        </Pressable>

        {categories.map(category => {
          const isSelected = selected === category.name;
          return (
            <Pressable
              key={category.slug || category.name}
              onPress={() => onSelect(isSelected ? undefined : category.name)}
              accessibilityRole="tab"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={strings.brandCategoryLabel(category.name, category.count)}
              hitSlop={CHIP_HIT_SLOP}
              style={({ pressed }) => [
                styles.chip,
                isSelected ? styles.chipSelected : styles.chipIdle,
                pressed && styles.pressed,
              ]}
            >
              <AppText
                variant="caption"
                color={isSelected ? colors.textPrimary : colors.textSecondary}
              >
                {category.name}
              </AppText>
              <AppText variant="caption" color={colors.textSecondary}>
                {category.count}
              </AppText>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    // Breathing room so the chips do not sit flush against the navigation bar
    // and the products. Kept small: the 44pt tap area already comes from
    // CHIP_HIT_SLOP, so this is purely visual and does not need to be generous.
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  chip: {
    // minHeight, not height: at a large OS text size the label's line box grows
    // past a fixed 32pt and would be cropped. The chip keeps its resting size
    // and only grows when the user asks for bigger text.
    minHeight: dimensions.filterChipHeight,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  chipIdle: {
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipSelected: {
    borderColor: colors.textPrimary,
    backgroundColor: colors.surface,
  },
  pressed: {
    opacity: 0.6,
  },
});
