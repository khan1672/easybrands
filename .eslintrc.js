module.exports = {
  root: true,
  extends: '@react-native',
  parserOptions: {
    ecmaFeatures: { jsx: true },
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'error',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    'react-native/no-color-literals': 'warn',
    'react-native/no-inline-styles': 'warn',
    'no-console': ['warn', { allow: ['warn', 'error'] }],
  },
  settings: {
    react: { version: 'detect' },
  },
  overrides: [
    {
      files: ['**/*.test.{js,ts,tsx}', '**/__tests__/**/*.{js,ts,tsx}', 'jest.setup.js'],
      env: {
        jest: true,
      },
    },
  ],
};