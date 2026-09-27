import React, { useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
  type FlatListProps,
} from 'react-native';
import { AppImage, AppText } from '@components/ui';
import { ImageViewer } from './ImageViewer';
import { colors } from '@theme/colors';
import { dimensions } from '@theme/dimensions';
import { radius } from '@theme/radius';
import { spacing } from '@theme/spacing';
import { strings } from '@utils/strings';
import type { ProductImage } from '@typings/product';

/** Derived from the list's own props so the shape can never drift. */
type ViewableItemsChanged = NonNullable<FlatListProps<ProductImage>['onViewableItemsChanged']>;

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
  const [viewerVisible, setViewerVisible] = useState(false);
  const listRef = useRef<FlatList<ProductImage>>(null);

  /**
   * The page is whichever item is actually on screen, reported by the list
   * itself. The previous version derived it from
   * Math.round(contentOffset.x / width), which disagrees with what the shopper
   * sees whenever the offset has not fully settled: the counter would jump to
   * the next photo while the current one was still filling the screen.
   */
  // Created once. A new identity on every render makes the list tear down and
  // re-register its viewability config on each pass.
  const [handleViewableItemsChanged] = useState<ViewableItemsChanged>(() => {
    return ({ viewableItems }: Parameters<ViewableItemsChanged>[0]) => {
      const next = viewableItems[0]?.index;
      if (typeof next === 'number') {
        setIndex(current => (current === next ? current : next));
      }
    };
  });
  // A new object identity on every render makes the list re-register the
  // callback, so it is created once.
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;

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
        onViewableItemsChanged={handleViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        keyExtractor={item => item.url}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={{ width }}>
            <Pressable
              onPress={() => setViewerVisible(true)}
              accessibilityRole="button"
              accessibilityLabel={`${item.alt || productName}. ${strings.productImageFullScreen}`}
            >
              <AppImage
                uri={item.url}
                style={[styles.image, { aspectRatio: dimensions.productImageAspectRatio }]}
                accessibilityLabel={item.alt || `${productName} image`}
              />
            </Pressable>
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

      <ImageViewer
        visible={viewerVisible}
        images={images}
        index={index}
        productName={productName}
        onClose={() => setViewerVisible(false)}
        // Paging inside the viewer moves the inline pager with it, so closing
        // the viewer never snaps back to a different photo.
        onIndexChange={next => {
          setIndex(next);
          scrollTo(next);
        }}
      />
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
