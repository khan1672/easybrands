import React, { useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { AppImage, AppText } from '@components/ui';
import { colors } from '@theme/colors';
import { dimensions } from '@theme/dimensions';
import { radius } from '@theme/radius';
import { spacing } from '@theme/spacing';
import { strings } from '@utils/strings';
import type { ProductImage } from '@typings/product';

interface ProductGalleryProps {
  images: ProductImage[];
  productName: string;
}

/**
 * Swipeable product imagery with a position counter and thumbnail strip.
 *
 * Width comes from the window rather than a fixed token so the pager fills any
 * screen the app runs on; the aspect ratio is a theme token so the image shape
 * stays consistent with the cards.
 */
export const ProductGallery: React.FC<ProductGalleryProps> = ({ images, productName }) => {
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList<ProductImage>>(null);

  if (images.length === 0) {
    return (
      <View style={[styles.empty, { aspectRatio: dimensions.productImageAspectRatio }]}>
        <AppText variant="caption" color={colors.textSecondary}>
          {strings.productNoImages}
        </AppText>
      </View>
    );
  }

  const scrollTo = (next: number): void => {
    listRef.current?.scrollToOffset({ offset: next * width, animated: true });
  };

  return (
    <View>
      <FlatList
        ref={listRef}
        data={images}
        horizontal
        pagingEnabled
        // Keeps the pager aligned while the window animates (rotation, split
        // screen) instead of leaving a partially visible page.
        onLayout={event => {
          const nextWidth = event.nativeEvent.layout.width;
          if (nextWidth !== width) {
            listRef.current?.scrollToOffset({ offset: index * nextWidth, animated: false });
          }
        }}
        onMomentumScrollEnd={event => {
          const next = Math.round(event.nativeEvent.contentOffset.x / width);
          setIndex(next);
        }}
        keyExtractor={item => item.url}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={{ width }}>
            <AppImage
              uri={item.url}
              style={[styles.image, { aspectRatio: dimensions.productImageAspectRatio }]}
              accessibilityLabel={item.alt || `${productName} image`}
            />
          </View>
        )}
      />

      {images.length > 1 ? (
        <View style={styles.counter} accessibilityRole="text">
          <AppText variant="caption" color={colors.textInverse}>
            {`${index + 1} / ${images.length}`}
          </AppText>
        </View>
      ) : null}

      {images.length > 1 ? (
        <FlatList
          data={images}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.thumbs}
          keyExtractor={item => item.url}
          renderItem={({ item, index: i }) => (
            <Pressable
              onPress={() => {
                setIndex(i);
                scrollTo(i);
              }}
              accessibilityRole="button"
              accessibilityState={{ selected: i === index }}
              accessibilityLabel={`${strings.productImageLabel} ${i + 1}`}
              style={[styles.thumb, i === index ? styles.thumbSelected : null]}
            >
              <AppImage uri={item.url} style={styles.thumbImage} accessibilityLabel="" />
            </Pressable>
          )}
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  image: {
    width: '100%',
    backgroundColor: colors.skeleton,
  },
  empty: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.skeleton,
  },
  counter: {
    position: 'absolute',
    bottom: spacing.md,
    right: spacing.md,
    backgroundColor: colors.overlay,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  thumbs: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  thumb: {
    width: dimensions.thumbnailSize,
    height: dimensions.thumbnailSize,
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.skeleton,
  },
  thumbSelected: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  thumbImage: {
    flex: 1,
    width: '100%',
  },
});
