import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '@components/ui';
import { AppButton } from '@components/ui';
import { colors } from '@theme/colors';
import { spacing } from '@theme/spacing';

interface EmptyStateProps {
  title: string;
  message: string;
  ctaLabel?: string;
  onCtaPress?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  message,
  ctaLabel,
  onCtaPress,
}) => {
  return (
    <View style={styles.container}>
      <AppText variant="heading3" color={colors.textPrimary}>
        {title}
      </AppText>
      <AppText
        variant="bodySmall"
        color={colors.textSecondary}
        style={styles.message}
      >
        {message}
      </AppText>
      {ctaLabel !== undefined && onCtaPress !== undefined ? (
        <AppButton label={ctaLabel} onPress={onCtaPress} />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.xl,
  },
  message: {
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});