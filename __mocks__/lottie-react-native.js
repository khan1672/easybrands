/**
 * Manual mock for lottie-react-native.
 *
 * The real package registers a native view manager, so importing it under Jest
 * would fail. The app only needs the component to mount and accept its props, so
 * this renders a plain View and never fires the animation callbacks (tests
 * assert on layout, not on the logo playing).
 */
const React = require('react');
const { View } = require('react-native');

const LottieView = props => React.createElement(View, { style: props.style, testID: props.testID });
LottieView.displayName = 'LottieView';

module.exports = { __esModule: true, default: LottieView };
