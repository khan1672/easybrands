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

jest.mock('@components/feedback/Skeleton', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    Skeleton: props => React.createElement(View, props),
  };
});