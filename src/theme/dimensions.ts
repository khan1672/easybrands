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
  /**
   * Visual height of a filter chip. Deliberately shorter than
   * `minTouchTarget`: the chip looks compact, and the gap to the 44pt
   * minimum tap area is made up with `hitSlop` on the Pressable.
   */
  filterChipHeight: 32,
};
