module.exports = {
  preset: '@react-native/jest-preset',
  transformIgnorePatterns: [
    'node_modules/(?!((@)?react-native|@react-native(-community)?|@react-navigation|@tanstack|react-native-[a-z-]+|@shopify)/)',
  ],
  setupFiles: [
    'react-native-gesture-handler/jestSetup',
    '<rootDir>/jest.setup.js',
  ],
  moduleNameMapper: {
    '^@app/(.*)$': '<rootDir>/src/app/$1',
    '^@navigation/(.*)$': '<rootDir>/src/navigation/$1',
    '^@features/(.*)$': '<rootDir>/src/features/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@store/(.*)$': '<rootDir>/src/store/$1',
    '^@hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@theme/(.*)$': '<rootDir>/src/theme/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@types/(.*)$': '<rootDir>/src/types/$1',
    '^@assets/(.*)$': '<rootDir>/src/assets/$1',
  },
};