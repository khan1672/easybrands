import { useCallback, useRef, useState } from 'react';
import {
  streamChat,
  type ChatMessage,
  type ChatStreamEvent,
  type SuggestedProduct,
} from '@services/api/chatApi';

export interface ChatTurn {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  products: SuggestedProduct[];
  /** True while the reply is still streaming. */
  streaming?: boolean;
  failed?: boolean;
}

export interface UseChat {
  turns: ChatTurn[];
  isThinking: boolean;
  error: string | null;
  send: (text: string) => Promise<void>;
  retry: () => Promise<void>;
  reset: () => void;
  stop: () => void;
}

let counter = 0;
const nextId = (prefix: string): string => `${prefix}-${(counter += 1)}`;

/**
 * Conversation state for the assistant.
 *
 * The reply is built up in place as tokens stream in, rather than replacing the
 * turn each time, so the text does not flicker and the scroll position holds.
 */
export const useChat = (): UseChat => {
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const turnsRef = useRef<ChatTurn[]>([]);
  turnsRef.current = turns;

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  const reset = useCallback(() => {
    stop();
    setTurns([]);
    setError(null);
    setIsThinking(false);
  }, [stop]);

  const run = useCallback(
    async (history: ChatMessage[]) => {
      const controller = new AbortController();
      abortRef.current = controller;

      const assistantId = nextId('a');
      setTurns(prev => [
        ...prev,
        { id: assistantId, role: 'assistant', content: '', products: [], streaming: true },
      ]);
      setIsThinking(true);
      setError(null);

      const patch = (change: Partial<ChatTurn>): void => {
        setTurns(prev =>
          prev.map(turn => (turn.id === assistantId ? { ...turn, ...change } : turn)),
        );
      };

      const handle = (event: ChatStreamEvent): void => {
        if (event.type === 'delta') {
          setTurns(prev =>
            prev.map(turn =>
              turn.id === assistantId
                ? { ...turn, content: turn.content + event.text }
                : turn,
            ),
          );
        } else if (event.type === 'products') {
          setTurns(prev =>
            prev.map(turn => {
              if (turn.id !== assistantId) return turn;
              const known = new Set(turn.products.map(p => p.id));
              const additions = event.products.filter(p => !known.has(p.id));
              return additions.length > 0
                ? { ...turn, products: [...turn.products, ...additions] }
                : turn;
            }),
          );
        } else if (event.type === 'error') {
          patch({ failed: true, streaming: false });
          setError(event.message);
        } else if (event.type === 'done') {
          patch({ streaming: false });
        }
      };

      try {
        await streamChat(history, { onEvent: handle, signal: controller.signal });
      } catch (err) {
        patch({ failed: true, streaming: false });
        setError((err as Error).message || 'Something went wrong.');
      } finally {
        // A turn left streaming after an abort would show a permanent ellipsis.
        setTurns(prev =>
          prev.map(turn =>
            turn.id === assistantId && turn.streaming
              ? { ...turn, streaming: false, failed: turn.content === '' }
              : turn,
          ),
        );
        setIsThinking(false);
        abortRef.current = null;
      }
    },
    [],
  );

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (trimmed === '' || isThinking) return;

      const userTurn: ChatTurn = {
        id: nextId('u'),
        role: 'user',
        content: trimmed,
        products: [],
      };
      setTurns(prev => [...prev, userTurn]);

      const history: ChatMessage[] = [
        ...turnsRef.current
          .filter(t => t.content.trim() !== '')
          .map(t => ({ role: t.role, content: t.content })),
        { role: 'user', content: trimmed },
      ];

      await run(history);
    },
    [isThinking, run],
  );

  const retry = useCallback(async () => {
    // The last user turn is the one we are retrying. Anything after it is the
    // failed attempt, so it is dropped rather than left behind as a duplicate.
    const lastUserId = [...turnsRef.current].reverse().find(t => t.role === 'user')?.id;
    if (!lastUserId) return;

    const upto = turnsRef.current.slice(
      0,
      turnsRef.current.findIndex(t => t.id === lastUserId) + 1,
    );
    setTurns(upto);
    setError(null);

    const history: ChatMessage[] = upto
      .filter(t => t.content.trim() !== '' && !t.streaming)
      .map(t => ({ role: t.role, content: t.content }));

    await run(history);
  }, [run]);

  return { turns, isThinking, error, send, retry, reset, stop };
};

export default useChat;
