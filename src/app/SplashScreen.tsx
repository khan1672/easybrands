import React, { useCallback, useEffect } from 'react';
import { Image, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '@theme/colors';
import { dimensions } from '@theme/dimensions';
import { strings } from '@utils/strings';

/** Play length is compressed from the 5s source so the splash stays snappy. */
const PLAY_DURATION_MS = 2200;
const FADE_OUT_MS = 300;
/** Reduced-motion fallback lingers just long enough to register the brand. */
const REDUCED_MOTION_MS = 700;

interface SplashScreenProps {
  /** Called once the logo has played and the overlay has faded away. */
  onFinish: () => void;
}

/**
 * Branded launch overlay. Plays the animated Easybrands logo on top of the app,
 * which mounts underneath it, then cross-fades out. There is no native splash
 * any more, so this is the only launch screen the user sees.
 *
 * The app is interactive the moment this unmounts, so the animation is treated
 * as decoration: it respects reduced-motion and cannot hang the launch — a Lottie
 * load failure falls straight through to the app.
 */
export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const reduceMotion = useReducedMotion();
  const opacity = useSharedValue(1);

  const fadeOut = useCallback((): void => {
    opacity.value = withTiming(0, { duration: FADE_OUT_MS }, (finished) => {
      if (finished) {
        runOnJS(onFinish)();
      }
    });
  }, [onFinish, opacity]);

  useEffect(() => {
    if (!reduceMotion) return;
    const timer = setTimeout(fadeOut, REDUCED_MOTION_MS);
    return () => clearTimeout(timer);
  }, [fadeOut, reduceMotion]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[styles.root, animatedStyle]}
      accessible
      accessibilityRole="image"
      accessibilityLabel={strings.splashAccessibilityLabel}
    >
      {reduceMotion ? (
        <Image source={require('@assets/images/logo.jpeg')} style={styles.logo} resizeMode="contain" />
      ) : (
        <LottieView
          source={require('@assets/animated/easybrands-logo.json')}
          autoPlay
          loop={false}
          duration={PLAY_DURATION_MS}
          resizeMode="contain"
          onAnimationFinish={fadeOut}
          onAnimationFailure={fadeOut}
          style={styles.logo}
        />
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  logo: {
    width: dimensions.splashLogoWidth,
    aspectRatio: dimensions.splashLogoAspectRatio,
  },
});
