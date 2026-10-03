/**
 * @format
 */

jest.mock('react-native-mmkv', () => {
  const storage = {
    getString: jest.fn(() => undefined),
    set: jest.fn(),
    remove: jest.fn(),
    clearAll: jest.fn(),
    contains: jest.fn(() => false),
    getAllKeys: jest.fn(() => []),
  };
  return {
    createMMKV: jest.fn(() => storage),
  };
});

jest.mock('react-native-keychain', () => ({
  setGenericPassword: jest.fn(async () => true),
  getGenericPassword: jest.fn(async () => undefined),
  resetGenericPassword: jest.fn(async () => true),
}));

jest.mock('react-native-worklets', () =>
  require('react-native-worklets/lib/module/mock.js'),
);

// react-native-reanimated is stubbed via the manual mock in
// __mocks__/react-native-reanimated.js, which Jest applies automatically to node
// modules. No jest.mock() call is needed (and the real package must never be
// required here, or it throws while initialising its native module).

// react-native-keyboard-controller is a native module. The components are plain
// Views, so rendering them as-is is safe and keeps layout assertions honest.
jest.mock('react-native-keyboard-controller', () => {
  const React = require('react');
  const { View } = require('react-native');
  const passthrough = (name: string) => {
    const Component = ({ children, ...props }: { children?: React.ReactNode }) =>
      React.createElement(View, props, children);
    Component.displayName = name;
    return Component;
  };
  return {
    KeyboardProvider: passthrough('KeyboardProvider'),
    KeyboardStickyView: passthrough('KeyboardStickyView'),
    KeyboardAvoidingView: passthrough('KeyboardAvoidingView'),
    KeyboardAwareScrollView: passthrough('KeyboardAwareScrollView'),
    useKeyboardController: () => ({
      isVisible: false,
      visible: false,
      height: 0,
      progress: { value: 0 },
      setEnabled: jest.fn(),
    }),
    // Lets a test drive visibility the way the OS would.
    useKeyboardState: (selector) =>
      selector({ isVisible: false, height: 0, appearance: 'default', type: 'numeric' }),
  };
});
