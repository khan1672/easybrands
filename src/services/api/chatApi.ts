import { API_BASE_URL } from './apiHost';
import { apiLogger } from './apiLogger';

export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

/**
 * A product the assistant is suggesting.
 *
 * These come from the server's own catalogue search, never from generated text,
 * so a price or brand shown here is always a real record.
 */
export interface SuggestedProduct {
  id: string;
  name: string;
  brand: string;
  /** Null when the merchant published no price. */
  price: number | null;
  compareAtPrice?: number;
  currency: string;
  category: string;
  imageUrl?: string;
  inStock: boolean;
}

export type ChatStreamEvent =
  | { type: 'delta'; text: string }
  | { type: 'products'; products: SuggestedProduct[] }
  | { type: 'done' }
  | { type: 'error'; message: string };

export interface ChatStreamHandlers {
  onEvent: (event: ChatStreamEvent) => void;
  signal?: AbortSignal;
}

export class ChatError extends Error {
  readonly code: string | undefined;
  readonly status: number | undefined;

  constructor(message: string, code?: string, status?: number) {
    super(message);
    this.name = 'ChatError';
    this.code = code;
    this.status = status;
  }
}

const isEvent = (value: unknown): value is ChatStreamEvent =>
  !!value && typeof value === 'object' && typeof (value as { type?: unknown }).type === 'string';

/**
 * Pulls complete SSE frames out of a growing text buffer.
 *
 * Exported so the parsing can be tested without a network or a real XHR.
 */
export const takeSseFrames = (buffer: string): { frames: string[]; rest: string } => {
  const parts = buffer.split('\n\n');
  const rest = parts.pop() ?? '';
  return { frames: parts, rest };
};

export const parseSseFrame = (frame: string): ChatStreamEvent | null => {
  for (const line of frame.split('\n')) {
    if (!line.startsWith('data:')) continue;
    const payload = line.slice(5).trim();
    if (!payload) continue;
    try {
      const parsed: unknown = JSON.parse(payload);
      if (isEvent(parsed)) return parsed;
    } catch {
      // Ignore anything that is not a complete JSON event.
    }
  }
  return null;
};

/**
 * Posts a conversation and reads the reply as it is written.
 *
 * Uses XMLHttpRequest rather than `fetch` on purpose: React Native's fetch is
 * built on XHR and buffers the entire response, so `response.body` is undefined
 * and the reply would only appear once it was fully generated. Reading
 * `responseText` during `onprogress` is what makes the reply stream in.
 */
export const streamChat = async (
  messages: ChatMessage[],
  { onEvent, signal }: ChatStreamHandlers,
): Promise<void> =>
  new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const startedAt = Date.now();
    let buffer = '';
    let settled = false;
    let streamedChars = 0;
    let eventCount = 0;

    // Streamed like every other call, so it shows in the same coloured console.
    apiLogger.logRequest({ method: 'POST', url: '/chat', body: { messages } });

    const finish = (): void => {
      if (settled) return;
      settled = true;
      signal?.removeEventListener('abort', onAbort);
      resolve();
    };

    const fail = (error: ChatError): void => {
      if (settled) return;
      settled = true;
      signal?.removeEventListener('abort', onAbort);
      apiLogger.logError({
        method: 'POST',
        url: '/chat',
        durationMs: Date.now() - startedAt,
        status: error.status,
        error: { message: error.message, code: error.code },
      });
      reject(error);
    };

    function onAbort(): void {
      xhr.abort();
      // An abort is a user action, not a failure.
      finish();
    }

    const drain = (): void => {
      const { frames, rest } = takeSseFrames(buffer);
      buffer = rest;
      for (const frame of frames) {
        const event = parseSseFrame(frame);
        if (event) {
          eventCount += 1;
          onEvent(event);
        }
      }
    };

    xhr.onprogress = () => {
      buffer = xhr.responseText ?? '';
      streamedChars = buffer.length;
      drain();
    };

    xhr.onload = () => {
      buffer = xhr.responseText ?? '';
      streamedChars = buffer.length;
      drain();

      const status = xhr.status;
      if (status < 200 || status >= 300) {
        let body: { error?: string; code?: string } | null = null;
        try {
          body = JSON.parse(xhr.responseText) as { error?: string; code?: string };
        } catch {
          body = null;
        }
        fail(
          new ChatError(
            body?.error ?? `The stylist is unavailable (${status}).`,
            body?.code,
            status,
          ),
        );
        return;
      }
      apiLogger.logResponse({
        method: 'POST',
        url: '/chat',
        status,
        statusText: xhr.statusText,
        durationMs: Date.now() - startedAt,
        body: { events: eventCount, chars: streamedChars },
      });
      finish();
    };

    xhr.onerror = () => fail(new ChatError('Could not reach the stylist. Check your connection.'));
    xhr.ontimeout = () => fail(new ChatError('The stylist took too long to reply.'));

    if (signal?.aborted) {
      resolve();
      return;
    }
    signal?.addEventListener('abort', onAbort);

    xhr.open('POST', `${API_BASE_URL}/chat`);
    xhr.setRequestHeader('content-type', 'application/json');
    xhr.send(JSON.stringify({ messages }));
  });

export default { streamChat, takeSseFrames, parseSseFrame };
