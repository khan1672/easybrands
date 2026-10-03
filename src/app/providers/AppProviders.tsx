import React from 'react';
import { StyleSheet } from 'react-native';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
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
        {/*
         * Tracks the real keyboard frame, so bottom-anchored inputs sit exactly
         * on the keyboard instead of being estimated from KeyboardAvoidingView.
         * navigationBarTranslucent matches the edge-to-edge setup the app uses on
         * Android, which is what keeps the composer off the gesture bar.
         */}
        <KeyboardProvider navigationBarTranslucent>
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        </KeyboardProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};