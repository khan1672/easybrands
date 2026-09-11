import React from 'react';
import { StyleSheet } from 'react-native';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { queryClient } from './queryClient';

interface AppProvidersProps {
  children: React.ReactNode;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};