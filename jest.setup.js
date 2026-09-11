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