import React, { useCallback, useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppImage, AppText } from '@components/ui';
import { colors } from '@theme/colors';
import { dimensions } from '@theme/dimensions';
import { radius } from '@theme/radius';
import { spacing } from '@theme/spacing';
import { strings } from '@utils/strings';
import type { ProductImage } from '@typings/product';

interface ImageViewerProps {
  visible: boolean;
  images: ProductImage[];
  index: number;
  productName: string;
  onClose: () => void;
  onIndexChange: (next: number) => void;
}

const MAX_SCALE = 4;
const DOUBLE_TAP_SCALE = 2.5;
const ANIMATION_MS = 180;
/** Horizontal travel, in points, that counts as a deliberate page swipe. */
const SWIPE_DISTANCE = 40;

/**
 * Runs on the UI thread inside the gesture and style worklets below, so it has
 * to be a worklet itself. Without the directive the call would have to cross
 * from the UI runtime back to JS, which is synchronous and not allowed.
 */
const clamp = (value: number, min: number, max: number): number => {
  'worklet';
  return Math.min(Math.max(value, min), max);
};

/**
 * Which photo a horizontal drag should land on.
 *
 * A worklet so the gesture can use it on the UI thread, and exported so the
 * direction rules can be unit tested without a native gesture system.
 * Exported so tests can cover the direction rules directly: going back has to
 * step to the previous photo, and the ends of the gallery must not wrap.
 */
export const stepPage = (current: number, translationX: number, length: number): number => {
  'worklet';
  if (Math.abs(translationX) < SWIPE_DISTANCE) {
    return current;
  }
  return clamp(current + (translationX < 0 ? 1 : -1), 0, length - 1);
};

/**
 * Full-screen image viewer that zooms in place.
 *
 * The image never translates vertically: there is no swipe-to-dismiss and no
 * vertical pan, so the photo always stays centred and only its size changes.
 * That is deliberate — a shopper inspecting fabric or a print should not have
 * to fight the image, and an accidental drag should never feel like the
 * viewer is trying to close itself.
 *
 * One horizontal Pan covers the two remaining behaviours, because two
 * overlapping pans fight each other: while the image is zoomed it pans
 * sideways, and while it is not it changes photo. Pinch runs simultaneously
 * with it so a zoom can be corrected mid-gesture. A vertical drag fails the
 * pan outright, so the image ignores it instead of tracking the finger.
 *
 * A RN Modal is a separate native window on Android and does not inherit the
 * app's GestureHandlerRootView, so the content is wrapped in its own.
 */
export const ImageViewer: React.FC<ImageViewerProps> = ({
  visible,
  images,
  index,
  productName,
  onClose,
  onIndexChange,
}) => {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const startX = useSharedValue(0);
  /**
   * The current page, mirrored for the gesture. Reading the `index` prop
   * inside the worklet depends on the handler being rebuilt with the latest
   * closure; reading a shared value is always current, which is what makes
   * stepping backwards reliable.
   */
  const currentPage = useSharedValue(index);

  useEffect(() => {
    currentPage.value = index;
  }, [currentPage, index]);

  const [chromeVisible, setChromeVisible] = useState(true);

  /** Back to page one, unzoomed. */
  const resetZoom = useCallback(() => {
    scale.value = withTiming(1, { duration: ANIMATION_MS });
    savedScale.value = 1;
    translateX.value = withTiming(0, { duration: ANIMATION_MS });
  }, [savedScale, scale, translateX]);

  const changeIndex = useCallback(
    (next: number) => {
      onIndexChange(next);
    },
    [onIndexChange],
  );

  const toggleChrome = useCallback(() => setChromeVisible(v => !v), []);

  const pinch = Gesture.Pinch()
    .onUpdate(event => {
      scale.value = clamp(savedScale.value * event.scale, 1, MAX_SCALE);
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      if (scale.value <= 1) {
        translateX.value = withTiming(0, { duration: ANIMATION_MS });
      }
    });


  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .maxDuration(260)
    .onEnd(() => {
      if (scale.value > 1) {
        runOnJS(resetZoom)();
      } else {
        scale.value = withTiming(DOUBLE_TAP_SCALE, { duration: ANIMATION_MS });
        savedScale.value = DOUBLE_TAP_SCALE;
      }
    });

  const singleTap = Gesture.Tap()
    .numberOfTaps(1)
    .maxDuration(260)
    .onEnd(() => {
      runOnJS(toggleChrome)();
    });

  /**
   * Horizontal only. failOffsetY makes a vertical drag fail recognition
   * outright, so the image stays put instead of latching onto a gesture it
   * will not act on.
   */
  const horizontalDrag = Gesture.Pan()
    .minDistance(6)
    .activeOffsetX([-10, 10])
    .failOffsetY([-18, 18])
    .onBegin(() => {
      startX.value = translateX.value;
    })
    .onUpdate(event => {
      if (scale.value > 1) {
        // Bound panning so the image cannot be dragged off screen.
        const limitX = (width * (scale.value - 1)) / 2;
        translateX.value = clamp(startX.value + event.translationX, -limitX, limitX);
      }
    })
    .onEnd(event => {
      if (scale.value > 1) {
        return;
      }
      const from = currentPage.value;
      const next = stepPage(from, event.translationX, images.length);
      if (next !== from) {
        runOnJS(changeIndex)(next);
        runOnJS(resetZoom)();
      }
    });

  const composed = Gesture.Simultaneous(
    pinch,
    horizontalDrag,
    Gesture.Exclusive(doubleTap, singleTap),
  );

  // Scale about the centre only: no translateY, so the image cannot slide up
  // or down under any gesture.
  const imageStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { scale: scale.value }],
  }));

  const current = images[index];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <GestureHandlerRootView style={styles.root}>
        <View style={styles.backdrop}>
          <GestureDetector gesture={composed}>
            <View style={styles.stage} collapsable={false}>
              {current ? (
                <Animated.View style={imageStyle}>
                  <AppImage
                    uri={current.url}
                    style={[styles.image, { width, height, borderRadius: radius.none }]}
                    accessibilityLabel={current.alt || `${productName} image`}
                    resizeMode="contain"
                  />
                </Animated.View>
              ) : null}
            </View>
          </GestureDetector>
        </View>

        {chromeVisible ? (
          <View style={[styles.chrome, { paddingTop: insets.top + spacing.sm }]} pointerEvents="box-none">
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel={strings.filterClose}
              style={styles.closeButton}
              hitSlop={spacing.sm}
            >
              <AppText variant="heading3" color={colors.textInverse}>
                {'✕'}
              </AppText>
            </Pressable>
            {images.length > 1 ? (
              <View style={styles.counter} accessibilityRole="text">
                <AppText variant="caption" color={colors.textInverse}>
                  {`${index + 1} / ${images.length}`}
                </AppText>
              </View>
            ) : null}
          </View>
        ) : null}

        {chromeVisible ? (
          <View
            style={[styles.hint, { paddingBottom: insets.bottom + spacing.lg }]}
            pointerEvents="none"
          >
            <AppText variant="caption" color={colors.textInverse}>
              {strings.productZoomHint}
            </AppText>
          </View>
        ) : null}
      </GestureHandlerRootView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
    backgroundColor: colors.viewerBackdrop,
  },
  stage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    flex: 1,
  },
  chrome: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
  },
  closeButton: {
    minWidth: dimensions.minTouchTarget,
    minHeight: dimensions.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counter: {
    backgroundColor: colors.viewerBackdrop,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  hint: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
});
