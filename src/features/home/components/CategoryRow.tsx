import React from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { AppImage, AppText } from '@components/ui';
import { colors } from '@theme/colors';
import { dimensions } from '@theme/dimensions';
import { radius } from '@theme/radius';
import { spacing } from '@theme/spacing';
import { Category } from '@typings/category';

interface CategoryRowProps {
  categories: Category[];
  onPress: (category: Category) => void;
}

export const CategoryRow: React.FC<CategoryRowProps> = ({ categories, onPress }) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
    >
      {categories.map(category => (
        <Pressable
          key={category.id}
          onPress={() => onPress(category)}
          accessibilityRole="button"
          accessibilityLabel={category.name}
          style={({ pressed }) => [styles.item, pressed && styles.pressed]}
        >
          <AppImage
            uri={category.image}
            style={styles.thumbnail}
            accessibilityLabel={category.name}
          />
          <AppText variant="caption" numberOfLines={1} style={styles.name}>
            {category.name}
          </AppText>
        </Pressable>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.md,
    gap: spacing.lg,
  },
  item: {
    width: dimensions.thumbnailSize,
    alignItems: 'center',
  },
  thumbnail: {
    width: dimensions.thumbnailSize,
    height: dimensions.thumbnailSize,
    borderRadius: radius.full,
  },
  name: {
    marginTop: spacing.sm,
    textAlign: 'center',
    color: colors.textPrimary,
  },
  pressed: {
    opacity: 0.7,
  },
});