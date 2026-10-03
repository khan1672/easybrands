/**
 * @format
 *
 * How the chat composer is positioned against the keyboard.
 *
 * Regression guard for a bug that took three attempts to pin down. The composer
 * used to be wrapped in React Native's KeyboardAvoidingView, and that approach
 * fails twice over on a native-stack screen:
 *
 *   1. The native header already insets the screen content, so any
 *      keyboardVerticalOffset double-counts it and lifts the input a full
 *      header height above the keyboard.
 *   2. The bottom safe-area inset has to be dropped while the keyboard is up,
 *      because the keyboard covers the home indicator. Applying it anyway left
 *      the input floating in dead space.
 *
 * KeyboardStickyView tracks the real keyboard frame and owns the keyboard, but it
 * does not pad for the system navigation bar, so the composer still takes a
 * bottomInset while the keyboard is closed. Applying both at once is what makes
 * the input float above the keyboard.
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { act } from 'react-test-renderer';
import { KeyboardAvoidingView } from 'react-native';
import { KeyboardStickyView } from 'react-native-keyboard-controller';

import { ChatScreen } from '../src/features/chat/screens/ChatScreen';
import { ChatComposer } from '../src/components/chat/ChatComposer';
import { spacing } from '../src/theme/spacing';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 47, bottom: 34, left: 0, right: 0 }),
  SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
  initialWindowMetrics: { insets: { top: 47, bottom: 34, left: 0, right: 0 } },
}));

const mockKeyboard = { isVisible: false };

jest.mock('react-native-keyboard-controller', () => {
  // Not requireActual: the real module asserts native linking at import time,
  // which fails in Jest by design.
  const { View } = require('react-native');
  return {
    KeyboardProvider: View,
    KeyboardStickyView: View,
    KeyboardAvoidingView: View,
    useKeyboardState: (selector?: (state: { isVisible: boolean }) => unknown) =>
      selector ? selector(mockKeyboard) : mockKeyboard,
  };
});

const navigation = { navigate: jest.fn() } as never;
const route = { key: 'Chat', name: 'Chat' } as never;

const renderScreen = async (isKeyboardVisible = false) => {
  // The mocked hook reads at render time, so the state is set before mounting.
  mockKeyboard.isVisible = isKeyboardVisible;
  let renderer: ReactTestRenderer.ReactTestRenderer | undefined;
  await act(async () => {
    renderer = ReactTestRenderer.create(<ChatScreen navigation={navigation} route={route} />);
  });
  if (!renderer) throw new Error('no render');
  return renderer.root;
};

const paddingBottomOf = (instance: ReactTestRenderer.ReactTestInstance): number => {
  const style = instance.props.style as
    | { paddingBottom?: number }
    | Array<{ paddingBottom?: number }>;
  const parts = Array.isArray(style) ? style : [style];
  return parts.find(p => p?.paddingBottom !== undefined)?.paddingBottom ?? -1;
};

describe('ChatScreen keyboard handling', () => {
  it('wraps the composer in a sticky view that tracks the keyboard', async () => {
    const root = await renderScreen();
    expect(root.findAllByType(KeyboardStickyView).length).toBeGreaterThan(0);
  });

  it('puts the composer inside the sticky view, not outside it', async () => {
    const root = await renderScreen();
    const sticky = root.findByType(KeyboardStickyView);
    const composer = root.findByType(ChatComposer);
    // The composer must be a descendant, or the keyboard will not move it.
    let node: ReactTestRenderer.ReactTestInstance | null = composer;
    let inside = false;
    while (node) {
      if (node.type === KeyboardStickyView) {
        inside = true;
        break;
      }
      node = node.parent as ReactTestRenderer.ReactTestInstance | null;
    }
    expect(inside).toBe(true);
    expect(sticky).toBeTruthy();
  });

  it('no longer uses KeyboardAvoidingView', async () => {
    const root = await renderScreen();
    // Reintroducing it brings the header double-count and the adjustResize race
    // back with it.
    expect(root.findAllByType(KeyboardAvoidingView)).toHaveLength(0);
  });

  it('clears the system navigation bar while the keyboard is closed', async () => {
    const root = await renderScreen(false);
    // Without this the send button sits under the gesture bar.
    expect(paddingBottomOf(root.findByProps({ testID: 'chat-composer-row' }))).toBe(
      spacing.md + 34,
    );
  });

  it('drops the inset once the keyboard is up, so it is not counted twice', async () => {
    const root = await renderScreen(true);
    const row = root.findByProps({ testID: 'chat-composer-row' });
    // The sticky view already lifted it to the keyboard top; 34pt more would
    // leave the input floating in dead space.
    expect(paddingBottomOf(row)).toBe(spacing.md);
  });
});
