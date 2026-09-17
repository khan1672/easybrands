module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['.'],
        alias: {
          '@app': './src/app',
          '@navigation': './src/navigation',
          '@features': './src/features',
          '@components': './src/components',
          '@services': './src/services',
          '@store': './src/store',
          '@hooks': './src/hooks',
          '@theme': './src/theme',
          '@utils': './src/utils',
          '@typings': './src/types',
          '@assets': './src/assets',
        },
      },
    ],
    'react-native-worklets/plugin',
  ],
};