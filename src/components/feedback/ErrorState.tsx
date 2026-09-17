import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '@components/ui';
import { AppButton } from '@components/ui';
import { colors } from '@theme/colors';
import { spacing } from '@theme/spacing';

interface ErrorStateProps {
  title: string;
  message: string;
  ctaLabel: string;
  onRetry: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title,
  message,
  ctaLabel,
  onRetry,
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
      <AppButton label={ctaLabel} onPress={onRetry} accessibilityLabel={ctaLabel} />
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
    marginBottom: spacing.lg,
    marginTop: spacing.sm,
  },
});