import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '@components/ui';
import { spacing } from '@theme/spacing';

const styles = StyleSheet.create({
  root: {
    flex: 1,
    padding: spacing.xl,
  },
});

export const HomeScreen: React.FC = () => {
  return (
    <View style={styles.root}>
      <AppText variant="heading1">Home</AppText>
    </View>
  );
};