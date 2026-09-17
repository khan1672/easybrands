import React, { useState } from 'react';
import { Image, ImageResizeMode, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { colors } from '@theme/colors';
import { radius } from '@theme/radius';

interface AppImageProps {
  uri: string;
  style?: StyleProp<ViewStyle>;
  resizeMode?: ImageResizeMode;
  accessibilityLabel?: string;
}

export const AppImage: React.FC<AppImageProps> = ({
  uri,
  style,
  resizeMode = 'cover',
  accessibilityLabel,
}) => {
  const [hasLoaded, setHasLoaded] = useState(false);

  return (
    <View
      style={[styles.container, !hasLoaded && { backgroundColor: colors.skeleton }, style]}
    >
      <Image
        source={{ uri }}
        style={StyleSheet.absoluteFill}
        resizeMode={resizeMode}
        onLoad={() => setHasLoaded(true)}
        onError={() => setHasLoaded(false)}
        accessibilityLabel={accessibilityLabel}
        accessibilityIgnoresInvertColors
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
});