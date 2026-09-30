/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { Modal, StyleSheet, View } from 'react-native';
import { SafeAreaProvider, type Metrics } from 'react-native-safe-area-context';
import { AppBottomSheet } from '../src/components/ui/AppBottomSheet';

/** Fixed metrics so useSafeAreaInsets() has a value instead of throwing. */
const metrics = (bottom: number): Metrics => ({
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom },
});

/**
 * The sheet's Apply/Clear row sits at the very bottom of the screen, so it is
 * the part most likely to land under a home indicator or Android gesture bar.
 * A RN Modal is a separate native window on Android and does not inherit the
 * SafeAreaProvider context, which is why the inset is passed in explicitly.
 */
describe('AppBottomSheet safe area', () => {
  const renderSheet = async (
    bottomInset?: number,
    contextBottom = 0,
  ): Promise<ReturnType<typeof ReactTestRenderer.create>> => {
    let renderer: ReturnType<typeof ReactTestRenderer.create> | undefined;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <SafeAreaProvider initialMetrics={metrics(contextBottom)}>
          <AppBottomSheet visible title="Filter" onClose={() => {}} bottomInset={bottomInset}>
            <></>
          </AppBottomSheet>
        </SafeAreaProvider>,
      );
    });
    if (!renderer) {
      throw new Error('AppBottomSheet did not render');
    }
    return renderer;
  };

  /** The panel's resolved bottom padding, with the style array flattened. */
  const panelPadding = (renderer: ReturnType<typeof ReactTestRenderer.create>): number => {
    const panel = renderer.root.findByProps({ testID: 'app-bottom-sheet-panel' });
    return StyleSheet.flatten(panel.props.style).paddingBottom as number;
  };

  it('reserves the passed bottom inset on the panel', async () => {
    const renderer = await renderSheet(34);
    expect(panelPadding(renderer)).toBe(34);
  });

  it('still leaves breathing room when there is no inset', async () => {
    const renderer = await renderSheet(0);
    expect(panelPadding(renderer)).toBeGreaterThan(0);
  });

  it('falls back to the context inset when the caller passes none', async () => {
    const renderer = await renderSheet(undefined, 20);
    expect(panelPadding(renderer)).toBe(20);
  });

  it('prefers the explicit prop over the context value', async () => {
    const renderer = await renderSheet(34, 20);
    expect(panelPadding(renderer)).toBe(34);
  });

  it('renders inside a transparent modal so the list stays visible behind it', async () => {
    const renderer = await renderSheet(0);
    const modal = renderer.root.findByType(Modal);
    expect(modal.props.visible).toBe(true);
    expect(modal.props.transparent).toBe(true);
  });
});

/**
 * The panel is capped at maxHeight, so the body has to be the part that yields
 * space. When it did not, a large OS text size grew the content until the footer
 * was pushed out of the panel and the Apply action became unreachable.
 */
describe('AppBottomSheet footer reachability', () => {
  it('lets the body shrink so the footer is not pushed out of the capped panel', async () => {
    let renderer: ReturnType<typeof ReactTestRenderer.create> | undefined;
    await ReactTestRenderer.act(async () => {
      renderer = ReactTestRenderer.create(
        <SafeAreaProvider initialMetrics={metrics(0)}>
          <AppBottomSheet visible title="Filter" onClose={() => {}} bottomInset={0}>
            <></>
          </AppBottomSheet>
        </SafeAreaProvider>,
      );
    });
    if (!renderer) {
      throw new Error('AppBottomSheet did not render');
    }
    const panel = renderer.root.findByProps({ testID: 'app-bottom-sheet-panel' });
    const panelStyle = StyleSheet.flatten(panel.props.style);

    // The panel is height-capped, so something inside it has to be able to
    // give way. The body is that element: the footer must never be the one
    // that overflows, because it holds the Apply action.
    const shrinkable = renderer.root
      .findAllByType(View)
      .map((node) => StyleSheet.flatten(node.props.style))
      .filter((style) => style?.flexShrink === 1);

    expect(panelStyle.maxHeight).toBeDefined();
    expect(shrinkable.length).toBeGreaterThan(0);
  });
});
