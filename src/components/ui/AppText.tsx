import React from 'react';
import { StyleProp, Text, TextStyle } from 'react-native';
import { colors } from '@theme/colors';
import { typography } from '@theme/typography';

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
  return (
    <Text
      style={[typography[variant], { color }, style]}
      numberOfLines={numberOfLines}
      accessibilityLabel={accessibilityLabel}
      allowFontScaling
    >
      {children}
    </Text>
  );
};