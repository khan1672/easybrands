import React, { useMemo } from 'react';
import { StyleProp, Text, TextStyle, useWindowDimensions } from 'react-native';
import { colors } from '@theme/colors';
import { scaleTextStyle, typography } from '@theme/typography';

export type AppTextVariant =
  | 'display'
  | 'heading1'
  | 'heading2'
  | 'heading3'
  | 'body'
  | 'bodySmall'
  | 'caption'
  | 'button'
  | 'buttonSmall'
  | 'buttonMicro'
  | 'label';

interface AppTextProps {
  variant?: AppTextVariant;
  color?: string;
  numberOfLines?: number;
  style?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
  children: React.ReactNode;
}

export const AppText: React.FC<AppTextProps> = ({
  variant = 'body',
  color = colors.textPrimary,
  numberOfLines,
  style,
  accessibilityLabel,
  children,
}) => {
  // `fontScale` follows the OS text size setting, and `useWindowDimensions`
  // re-renders when it changes, so a user raising the text size sees every
  // label grow without a restart.
  const { fontScale } = useWindowDimensions();

  // Only the line box and letter spacing are scaled here: the platform already
  // scales the glyphs, so scaling fontSize too would apply the setting twice.
  const type = useMemo(() => scaleTextStyle(typography[variant], fontScale), [variant, fontScale]);

  return (
    <Text
      style={[type, { color }, style]}
      numberOfLines={numberOfLines}
      accessibilityLabel={accessibilityLabel}
      allowFontScaling
    >
      {children}
    </Text>
  );
};