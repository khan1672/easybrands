import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@components/ui';
import { colors } from '@theme/colors';
import { radius } from '@theme/radius';
import { spacing } from '@theme/spacing';
import { strings } from '@utils/strings';

interface HomeHeaderProps {
  onSearchPress?: () => void;
}

export const HomeHeader: React.FC<HomeHeaderProps> = ({ onSearchPress }) => {
  return (
    <View style={styles.root}>
      <AppText variant="label" color={colors.textPrimary} style={styles.brand}>
        {strings.brandName}
      </AppText>
      <Pressable
        onPress={onSearchPress}
        accessibilityRole="button"
        accessibilityLabel={strings.searchAccessibilityLabel}
        style={({ pressed }) => [
          styles.searchPill,
          { backgroundColor: colors.surface },
          pressed && styles.pressed,
        ]}
      >
        <AppText variant="bodySmall" color={colors.textSecondary}>
          {strings.searchPlaceholder}
        </AppText>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  brand: {
    letterSpacing: 3,
  },
  searchPill: {
    marginTop: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  pressed: {
    opacity: 0.7,
  },
});