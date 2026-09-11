import React from 'react';
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
  Theme,
} from '@react-navigation/native';
import { StatusBar, useColorScheme } from 'react-native';
import { colors } from '@theme/colors';
import { RootNavigator } from './RootNavigator';

const lightTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
    card: colors.surface,
    text: colors.textPrimary,
    border: colors.border,
    primary: colors.primary,
  },
};

const darkTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.background,
    card: colors.surface,
    text: colors.textPrimary,
    border: colors.border,
    primary: colors.primary,
  },
};

export const AppNavigation: React.FC = () => {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <NavigationContainer theme={isDarkMode ? darkTheme : lightTheme}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <RootNavigator />
    </NavigationContainer>
  );
};