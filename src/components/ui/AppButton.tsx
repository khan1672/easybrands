import React from 'react';
import { Pressable, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { AppText } from './AppText';
import { colors } from '@theme/colors';
import { radius } from '@theme/radius';
import { spacing } from '@theme/spacing';

type AppButtonVariant = 'primary' | 'secondary' | 'inverse';

interface AppButtonProps {
  label: string;
  onPress: () => void;
  variant?: AppButtonVariant;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

const variantBackground = (variant: AppButtonVariant): string => {
  switch (variant) {
    case 'secondary':
      return colors.surface;
    case 'inverse':
      return colors.textInverse;
    default:
      return colors.primary;
  }
};

const variantText = (variant: AppButtonVariant): string => {
  switch (variant) {
    case 'secondary':
      return colors.textPrimary;
    case 'inverse':
      return colors.textPrimary;
    default:
      return colors.textInverse;
  }
};

export const AppButton: React.FC<AppButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  style,
  accessibilityLabel,
}) => {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      accessibilityLabel={accessibilityLabel ?? label}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: variantBackground(variant) },
        variant === 'secondary' && styles.secondaryBorder,
        (pressed || disabled) && styles.dimmed,
        style,
      ]}
    >
      <AppText variant="buttonSmall" color={variantText(variant)}>
        {label}
      </AppText>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBorder: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  dimmed: {
    opacity: 0.6,
  },
});