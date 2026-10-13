import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { AppText } from '@components/ui';
import { colors } from '@theme/colors';
import { dimensions } from '@theme/dimensions';
import { strings } from '@utils/strings';

interface AnimatedChatButtonProps {
  onPress?: () => void;
}

/** The inner content cycles forever through these three states. */
type Scene = 'emblem' | 'ask' | 'bubble';

/** How long the non-animated scenes stay on screen before handing over. */
const ASK_DURATION_MS = 2400;
const BUBBLE_DURATION_MS = 2400;

/**
 * Chat entry point shown in the home header. Everything plays on a black
 * medallion ringed by a bright yellow snake, and the inner content keeps
 * cycling: the Easybrands emblem draws itself once, then the word "Ask" holds,
 * then an AI chat bubble pulses, then back to the emblem.
 *
 * The emblem scene is driven by its own animation (it advances the moment the
 * drawing finishes); the other two hand over on a timer. Motion-sensitive users
 * get the finished mark with no cycling at all.
 */
export const AnimatedChatButton: React.FC<AnimatedChatButtonProps> = ({ onPress }) => {
  const reduceMotion = useReducedMotion();
  const [scene, setScene] = useState<Scene>('emblem');
  const contentOpacity = useSharedValue(0);

  const handleEmblemFinish = useCallback((isCancelled: boolean) => {
    if (!isCancelled) {
      setScene('ask');
    }
  }, []);

  // The two static scenes advance on a timer; the emblem scene advances itself
  // from `onAnimationFinish`.
  useEffect(() => {
    if (reduceMotion || scene === 'emblem') {
      return;
    }
    const next: Scene = scene === 'ask' ? 'bubble' : 'emblem';
    const timer = setTimeout(() => setScene(next), scene === 'ask' ? ASK_DURATION_MS : BUBBLE_DURATION_MS);
    return () => clearTimeout(timer);
  }, [scene, reduceMotion]);

  // Cross-fade each scene in so the hand-off never looks like a hard cut.
  useEffect(() => {
    if (reduceMotion) {
      return;
    }
    contentOpacity.value = 0;
    contentOpacity.value = withTiming(1, { duration: 240 });
  }, [scene, reduceMotion, contentOpacity]);

  const contentStyle = useAnimatedStyle(() => ({ opacity: contentOpacity.value }));

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={strings.chatOpenLabel}
      style={({ pressed }) => [styles.root, pressed && styles.pressed]}
    >
      <LottieView
        source={require('@assets/animated/easybrands-base.json')}
        autoPlay={false}
        progress={0}
        resizeMode="contain"
        style={styles.layer}
      />

      {reduceMotion ? (
        <LottieView
          source={require('@assets/animated/easybrands-emblem.json')}
          autoPlay={false}
          progress={1}
          resizeMode="contain"
          style={styles.layer}
        />
      ) : (
        <Animated.View style={[styles.content, contentStyle]}>
          {scene === 'emblem' && (
            <LottieView
              source={require('@assets/animated/easybrands-emblem.json')}
              autoPlay
              loop={false}
              onAnimationFinish={handleEmblemFinish}
              resizeMode="contain"
              style={styles.layer}
            />
          )}
          {scene === 'ask' && (
            <AppText variant="button" color={colors.textInverse} style={styles.ask}>
              {strings.chatAskVariation}
            </AppText>
          )}
          {scene === 'bubble' && (
            <LottieView
              source={require('@assets/animated/easybrands-bubble.json')}
              autoPlay
              loop
              resizeMode="contain"
              style={styles.layer}
            />
          )}
        </Animated.View>
      )}

      {!reduceMotion && (
        <LottieView
          source={require('@assets/animated/easybrands-ring.json')}
          autoPlay
          loop
          resizeMode="contain"
          style={styles.layer}
        />
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  root: {
    width: dimensions.chatLogoSize,
    height: dimensions.chatLogoSize,
    alignItems: 'center',
    justifyContent: 'center',
  },
  layer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  content: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ask: {
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});
