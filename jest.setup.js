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
