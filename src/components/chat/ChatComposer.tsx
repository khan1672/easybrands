import React, { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { AppText } from '@components/ui';
import { colors } from '@theme/colors';
import { dimensions } from '@theme/dimensions';
import { radius } from '@theme/radius';
import { spacing } from '@theme/spacing';
import { typography } from '@theme/typography';
import { strings } from '@utils/strings';

interface ChatComposerProps {
  onSend: (text: string) => void;
  busy: boolean;
  onStop: () => void;
  /**
   * Bottom safe-area inset, applied only while the keyboard is closed.
   *
   * KeyboardStickyView moves the composer for the keyboard but does not pad for
   * the system navigation bar, so the closed state still needs this. The caller
   * must pass 0 once the keyboard is visible, otherwise the composer is lifted by
   * both and floats above it.
   */
  bottomInset?: number;
}

/**
 * Message input.
 *
 * Grows with the OS text size rather than clipping: the field is a minimum
 * height, so an accessibility text size pushes the composer taller instead of
 * hiding what is being typed.
 *
 * Keyboard handling is split: the screen wraps this in KeyboardStickyView for the
 * keyboard, and passes bottomInset for the system navigation bar only while the
 * keyboard is closed. Passing both at once is what floats the input.
 */
export const ChatComposer: React.FC<ChatComposerProps> = ({
  onSend,
  busy,
  onStop,
  bottomInset = 0,
}) => {
  const [value, setValue] = useState('');
  const canSend = value.trim() !== '' && !busy;

  const handleSend = (): void => {
    if (!canSend) return;
    onSend(value);
    setValue('');
  };

  return (
    <View testID="chat-composer-row" style={[styles.row, { paddingBottom: spacing.md + bottomInset }]}>
      <View style={styles.field}>
        <TextInput
          value={value}
          onChangeText={setValue}
          placeholder={strings.chatPlaceholder}
          placeholderTextColor={colors.textSecondary}
          style={styles.input}
          multiline
          accessibilityLabel={strings.chatInputLabel}
          editable={!busy}
          onSubmitEditing={handleSend}
          blurOnSubmit={false}
        />
      </View>
      {busy ? (
        <Pressable
          onPress={onStop}
          accessibilityRole="button"
          accessibilityLabel={strings.chatStopLabel}
          style={({ pressed }) => [styles.action, styles.stop, pressed && styles.pressed]}
        >
          <AppText variant="label" color={colors.textInverse}>
            {strings.chatStop}
          </AppText>
        </Pressable>
      ) : (
        <Pressable
          onPress={handleSend}
          disabled={!canSend}
          accessibilityRole="button"
          accessibilityLabel={strings.chatSendLabel}
          accessibilityState={{ disabled: !canSend }}
          style={({ pressed }) => [
            styles.action,
            !canSend && styles.actionDisabled,
            pressed && styles.pressed,
          ]}
        >
          <AppText
            variant="label"
            color={canSend ? colors.textInverse : colors.textSecondary}
          >
            {strings.chatSend}
          </AppText>
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    backgroundColor: colors.surface,
  },
  field: {
    flex: 1,
    justifyContent: 'center',
    minHeight: dimensions.minTouchTarget,
    maxHeight: 120,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  input: {
    // Token-driven, and without a fixed height so a large OS text size grows
    // the field instead of clipping what is being typed.
    ...typography.bodySmall,
    color: colors.textPrimary,
    padding: 0,
  },
  action: {
    minWidth: 64,
    minHeight: dimensions.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
    backgroundColor: colors.primary,
  },
  actionDisabled: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stop: {
    backgroundColor: colors.textSecondary,
  },
  pressed: {
    opacity: 0.6,
  },
});

export default ChatComposer;
