import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppButton, AppImage, AppText } from '@components/ui';
import { colors } from '@theme/colors';
import { dimensions } from '@theme/dimensions';
import { radius } from '@theme/radius';
import { spacing } from '@theme/spacing';
import { HeroBanner } from '@typings/home';

interface HeroBannerProps {
  banner: HeroBanner;
  onCtaPress: () => void;
}

export const HeroBannerView: React.FC<HeroBannerProps> = ({ banner, onCtaPress }) => {
  return (
    <View style={styles.root}>
      <AppImage
        uri={banner.image}
        style={styles.image}
        accessibilityLabel={banner.subtitle}
      />
      <View style={styles.overlay}>
        <AppText variant="heading1" color={colors.textInverse}>
          {banner.title}
        </AppText>
        <AppText variant="bodySmall" color={colors.textInverse} style={styles.subtitle}>
          {banner.subtitle}
        </AppText>
        <View style={styles.cta}>
          <AppButton label={banner.ctaLabel} variant="inverse" onPress={onCtaPress} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    aspectRatio: dimensions.bannerAspectRatio,
    borderRadius: radius.xxl,
    overflow: 'hidden',
    backgroundColor: colors.skeleton,
    justifyContent: 'flex-end',
  },
  image: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  overlay: {
    padding: spacing.xl,
  },
  subtitle: {
    marginTop: spacing.sm,
    opacity: 0.95,
  },
  cta: {
    marginTop: spacing.lg,
    alignSelf: 'flex-start',
  },
});