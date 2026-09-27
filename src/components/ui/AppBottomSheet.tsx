import React, { useEffect, useMemo } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { AppText } from './AppText';
import { colors } from '@theme/colors';
import { radius } from '@theme/radius';
import { spacing } from '@theme/spacing';
import { dimensions } from '@theme/dimensions';

interface AppBottomSheetProps {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  /** Rendered in the footer, typically a primary Apply action. */
  footer?: React.ReactNode;
  /** Shown under the title, e.g. the result count for the pending selection. */
  subtitle?: string;
  /**
   * Bottom safe-area inset to reserve under the footer.
   *
   * Read from context as a fallback, but a React Native `Modal` is a separate
   * native window on Android and does not inherit the SafeAreaProvider context,
   * so `useSafeAreaInsets()` reports 0 there. Callers rendered inside the
   * provider tree should pass the real value down.
   */
  bottomInset?: number;
}

const ANIMATION_MS = 220;

/**
 * Bottom sheet built on RN's Modal, so no extra dependency is needed. Tapping the
 * scrim or pressing back closes it; the panel traps the interaction so taps
 * inside do not dismiss.
 */
export const AppBottomSheet: React.FC<AppBottomSheetProps> = ({
  visible,
  title,
  subtitle,
  onClose,
  children,
  footer,
  bottomInset,
}) => {
  const insets = useSafeAreaInsets();
  const resolvedBottomInset = bottomInset ?? insets.bottom;
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(visible ? 1 : 0, { duration: ANIMATION_MS });
  }, [visible, progress]);

  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - progress.value) * dimensions.height * 0.4 }],
    opacity: progress.value,
  }));

  const scrimStyle = useAnimatedStyle(() => ({ opacity: progress.value * 0.4 }));

  // Keeps Apply/Clear above the home indicator and the Android gesture bar,
  // while still leaving breathing room on devices with no inset.
  const insetStyles = useMemo(
    () =>
      StyleSheet.create({
        panel: { paddingBottom: Math.max(resolvedBottomInset, spacing.md) },
      }),
    [resolvedBottomInset],
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.root}>
        <Animated.View style={[styles.scrim, scrimStyle]}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close"
          />
        </Animated.View>
        <Animated.View
          testID="app-bottom-sheet-panel"
          style={[styles.panel, insetStyles.panel, panelStyle]}
        >
          <View style={styles.header}>
            <View style={styles.headerText}>
              <AppText variant="heading3">{title}</AppText>
              {subtitle ? (
                <AppText variant="caption" color={colors.textSecondary}>
                  {subtitle}
                </AppText>
              ) : null}
            </View>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close"
              style={styles.closeButton}
              hitSlop={spacing.sm}
            >
              <AppText variant="heading3" color={colors.textSecondary}>
                {'✕'}
              </AppText>
            </Pressable>
          </View>
          <View style={styles.body}>{children}</View>
          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  scrim: {
    ...StyleSheet.absoluteFill,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.overlay,
  },
  panel: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  headerText: {
    flex: 1,
    gap: spacing.xs,
  },
  closeButton: {
    minWidth: dimensions.minTouchTarget,
    minHeight: dimensions.minTouchTarget,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  body: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
});
