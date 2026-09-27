/**
 * Manual mock for react-native-reanimated.
 *
 * Reanimated 4 cannot boot under Jest: importing the package calls
 * initializeReanimatedModule(), which resolves to the native CSS proxy and
 * throws "`setCSSEventHandler` is not available in JSReanimated". Its own
 * mock.js is unusable because it re-imports the real entry point.
 *
 * This stub implements only the API surface the app actually uses, with
 * immediate (non-animated) results: tests assert on layout, not on timing.
 */
const React = require('react');
const { View, Text, ScrollView, Image } = require('react-native');

/** Stable across renders, like the real hook. */
const useSharedValue = initial => {
  const ref = React.useRef(null);
  if (ref.current === null) {
    ref.current = { value: initial };
  }
  return ref.current;
};

/** Resolves the worklet immediately so static styles can be asserted. */
const useAnimatedStyle = factory => factory();

const identity = value => value;
const withTiming = toValue => identity(toValue);
const withDelay = (_, toValue) => identity(toValue);
const withRepeat = animation => identity(animation);
const withSequence = (...animations) => identity(animations[animations.length - 1]);
const withSpring = toValue => identity(toValue);
const cancelAnimation = () => undefined;
const interpolate = (value, _input, output) => {
  const [from, to] = output;
  return from + (to - from) * value;
};

const Easing = {
  linear: identity,
  ease: identity,
  inOut: fn => fn,
  in: fn => fn,
  out: fn => fn,
  bezier: () => identity,
};

const Animated = {
  View,
  Text,
  ScrollView,
  Image,
  createAnimatedComponent: Component => Component,
};

module.exports = {
  __esModule: true,
  default: Animated,
  Animated,
  Easing,
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useAnimatedRef: () => React.createRef(),
  useDerivedValue: factory => ({ value: factory() }),
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  runOnJS: fn => fn,
  runOnUI: fn => fn,
  setUpTests: () => undefined,
  advanceAnimationByTime: () => undefined,
  advanceAnimationByFrame: () => undefined,
};
