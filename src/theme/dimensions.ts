import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const dimensions = {
  width,
  height,
  isSmall: width < 375,
  isMedium: width >= 375 && width < 414,
  isLarge: width >= 414,
  productImageAspectRatio: 3 / 4,
  bannerAspectRatio: 16 / 9,
  thumbnailSize: 64,
  minTouchTarget: 44,
};
