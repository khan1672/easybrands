import React from 'react';
import { StyleSheet, TextInput, TextInputProps, View } from 'react-native';
import { AppText } from './AppText';
import { colors } from '@theme/colors';
import { radius } from '@theme/radius';
import { spacing } from '@theme/spacing';

interface AppInputProps {
  label?: string;
  value: string;
  onChangeText: (next: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  keyboardType?: TextInputProps['keyboardType'];
  accessibilityLabel?: string;
  /** Shown under the field in the error colour when the value is unusable. */
  errorText?: string;
  autoFocus?: boolean;
}

/**
 * Themed single-line text field. Numeric fields pass
 * `keyboardType="numeric"` so the platform shows a number pad.
 */
export const AppInput: React.FC<AppInputProps> = ({
  label,
  value,
  onChangeText,
  onBlur,
  placeholder,
  keyboardType,
  accessibilityLabel,
  errorText,
  autoFocus,
}) => {
  return (
    <View style={styles.container}>
      {label ? (
        <AppText variant="label" color={colors.textSecondary}>
          {label}
        </AppText>
      ) : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onBlur={onBlur}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        keyboardType={keyboardType}
        accessibilityLabel={accessibilityLabel ?? label}
        autoFocus={autoFocus}
        style={[styles.input, errorText ? styles.inputError : null]}
      />
      {errorText ? (
        <AppText variant="caption" color={colors.error}>
          {errorText}
        </AppText>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.textPrimary,
    minHeight: 44,
  },
  inputError: {
    borderColor: colors.error,
  },
});
