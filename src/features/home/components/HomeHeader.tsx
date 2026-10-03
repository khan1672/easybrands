import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@components/ui';
import { colors } from '@theme/colors';
import { dimensions } from '@theme/dimensions';
import { radius } from '@theme/radius';
import { spacing } from '@theme/spacing';
import { strings } from '@utils/strings';

interface HomeHeaderProps {
  onSearchPress?: () => void;
  onChatPress?: () => void;
}

export const HomeHeader: React.FC<HomeHeaderProps> = ({ onSearchPress, onChatPress }) => {
  return (
    <View style={styles.root}>
      <View style={styles.topRow}>
        <AppText variant="label" color={colors.textPrimary} style={styles.brand}>
          {strings.brandName}
        </AppText>
        <Pressable
          onPress={onChatPress}
          accessibilityRole="button"
          accessibilityLabel={strings.chatOpenLabel}
          style={({ pressed }) => [styles.chatPill, pressed && styles.pressed]}
        >
          <AppText variant="label" color={colors.textInverse}>
            {strings.chatOpenLabel}
          </AppText>
        </Pressable>
      </View>
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
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  brand: {
    letterSpacing: 3,
    flexShrink: 1,
  },
  chatPill: {
    minHeight: dimensions.minTouchTarget,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
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