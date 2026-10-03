import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { AppText } from '@components/ui';
import { colors } from '@theme/colors';
import { radius } from '@theme/radius';
import { spacing } from '@theme/spacing';
import { strings } from '@utils/strings';
import { SuggestedProductCard } from './SuggestedProductCard';
import type { ChatTurn, TurnProductPress } from '../../features/chat/types';

interface ChatBubbleProps {
  turn: ChatTurn;
  onProductPress: TurnProductPress;
}

/**
 * One message. The assistant's turn also carries the products it suggested,
 * which are rendered as real cards rather than as text in the reply.
 */
export const ChatBubble: React.FC<ChatBubbleProps> = ({ turn, onProductPress }) => {
  const isUser = turn.role === 'user';
  // Nothing typed yet and still streaming: show a thinking indicator rather
  // than an empty bubble that looks broken.
  const showThinking = !isUser && turn.streaming && turn.content === '';

  return (
    <View style={[styles.row, isUser ? styles.rowUser : styles.rowAssistant]}>
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}>
        {showThinking ? (
          <View style={styles.thinking}>
            <ActivityIndicator
              size="small"
              color={isUser ? colors.textInverse : colors.textSecondary}
            />
            <AppText
              variant="caption"
              color={isUser ? colors.textInverse : colors.textSecondary}
            >
              {strings.chatThinking}
            </AppText>
          </View>
        ) : (
          <AppText
            variant="bodySmall"
            color={isUser ? colors.textInverse : colors.textPrimary}
          >
            {turn.content}
          </AppText>
        )}

        {turn.products.length > 0 ? (
          <View style={styles.products}>
            {turn.products.map(product => (
              <SuggestedProductCard
                key={product.id}
                product={product}
                onPress={onProductPress}
              />
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  rowUser: {
    justifyContent: 'flex-end',
  },
  rowAssistant: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '88%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    gap: spacing.sm,
  },
  bubbleUser: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: radius.sm,
  },
  bubbleAssistant: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: radius.sm,
  },
  thinking: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  products: {
    gap: spacing.sm,
  },
});

export default ChatBubble;
