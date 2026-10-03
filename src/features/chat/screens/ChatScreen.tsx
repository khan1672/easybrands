import React, { useCallback, useEffect, useRef } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardStickyView, useKeyboardState } from 'react-native-keyboard-controller';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { AppText } from '@components/ui';
import { ChatBubble } from '@components/chat/ChatBubble';
import { ChatComposer } from '@components/chat/ChatComposer';
import { useChat } from '@features/chat/hooks/useChat';
import type { ChatTurn, SuggestedProduct } from '@features/chat/types';
import { track } from '@services/analytics';
import { colors } from '@theme/colors';
import { spacing } from '@theme/spacing';
import { strings } from '@utils/strings';
import type { RootStackParamList } from '@navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Chat'>;

const STARTERS = strings.chatStarters;

export const ChatScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  // Selector form, so the screen only re-renders on an actual visibility flip.
  const isKeyboardVisible = useKeyboardState(state => state.isVisible);
  const { turns, isThinking, error, send, retry, stop } = useChat();
  const listRef = useRef<FlatList<ChatTurn>>(null);
  const hasTracked = useRef(false);
  useEffect(() => {
    if (hasTracked.current) return;
    hasTracked.current = true;
    track('chat_opened', { source: 'home' });
  }, []);

  // Follow the reply as it grows.
  useEffect(() => {
    if (turns.length === 0) return;
    const timer = setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 60);
    return () => clearTimeout(timer);
  }, [turns]);

  const handleSend = useCallback(
    (text: string) => {
      track('chat_message_sent', { length: text.length });
      send(text).catch(() => {
        // useChat records the failure on the turn itself.
      });
    },
    [send],
  );

  const handleProductPress = useCallback(
    (product: SuggestedProduct) => {
      track('chat_product_opened', { product_id: product.id, brand: product.brand });
      navigation.navigate('ProductDetails', { slug: product.id, source: 'chat' });
    },
    [navigation],
  );

  const renderTurn = useCallback(
    ({ item }: { item: ChatTurn }) => (
      <ChatBubble turn={item} onProductPress={handleProductPress} />
    ),
    [handleProductPress],
  );

  const showEmpty = turns.length === 0;

  // Two separate concerns, deliberately not conflated:
  //   KeyboardStickyView tracks the real keyboard frame and lifts the composer.
  //   bottomInset clears the system navigation bar, and only while the keyboard is
  //   closed, because the keyboard already covers the home indicator when open.
  // KeyboardAvoidingView was tried first and failed twice: the native-stack header
  // already insets this content so any keyboardVerticalOffset double-counts it, and
  // the navigation-bar inset has to be dropped once the keyboard is up.
  return (
    <View style={styles.root}>
      {showEmpty ? (
        <View style={styles.empty}>
          <AppText variant="heading3">{strings.chatEmptyTitle}</AppText>
          <AppText variant="bodySmall" color={colors.textSecondary} style={styles.emptyBody}>
            {strings.chatEmptyBody}
          </AppText>
          <View style={styles.starters}>
            {STARTERS.map(starter => (
              <Pressable
                key={starter}
                onPress={() => handleSend(starter)}
                accessibilityRole="button"
                accessibilityLabel={starter}
                style={({ pressed }) => [styles.starter, pressed && styles.pressed]}
              >
                <AppText variant="bodySmall">{starter}</AppText>
              </Pressable>
            ))}
          </View>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={turns}
          keyExtractor={turn => turn.id}
          renderItem={renderTurn}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: spacing.lg + (isKeyboardVisible ? 0 : insets.bottom) },
          ]}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            error ? (
              <View style={styles.error}>
                <AppText variant="caption" color={colors.error}>
                  {error}
                </AppText>
                <Pressable
                  onPress={() => {
                    retry().catch(() => undefined);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={strings.chatErrorCta}
                  style={({ pressed }) => [styles.retry, pressed && styles.pressed]}
                >
                  <AppText variant="label" color={colors.textInverse}>
                    {strings.chatErrorCta}
                  </AppText>
                </Pressable>
              </View>
            ) : undefined
          }
        />
      )}

      <KeyboardStickyView>
        <ChatComposer
          onSend={handleSend}
          busy={isThinking}
          onStop={stop}
          bottomInset={isKeyboardVisible ? 0 : insets.bottom}
        />
      </KeyboardStickyView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  emptyBody: {
    marginBottom: spacing.md,
  },
  starters: {
    gap: spacing.sm,
  },
  starter: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    minHeight: 44,
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.6,
  },
  error: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  retry: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.lg,
    minHeight: 44,
    justifyContent: 'center',
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
});

export default ChatScreen;
