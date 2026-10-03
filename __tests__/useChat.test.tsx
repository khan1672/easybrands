/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { act } from 'react-test-renderer';

import type { ChatStreamEvent } from '../src/services/api/chatApi';

let mockFail: Error | null = null;
let mockSent: string[] = [];

const HSY_SHIRT = {
  id: 'HSY:a',
  name: 'Shirt',
  brand: 'HSY',
  price: 4500,
  currency: 'PKR',
  category: 'Ready to Wear',
  inStock: true,
};

/** The scripted reply every test sees unless it fails. */
const emitScript = (send: (event: ChatStreamEvent) => void): void => {
  send({ type: 'delta', text: 'Try ' });
  send({ type: 'delta', text: 'these.' });
  send({ type: 'products', products: [HSY_SHIRT] });
  // A second lookup returning the same product must not duplicate the card.
  send({ type: 'products', products: [HSY_SHIRT] });
  send({ type: 'done' });
};

jest.mock('../src/services/api/chatApi', () => ({
  streamChat: jest.fn(
    async (
      messages: { role: string; content: string }[],
      handlers: { onEvent: (event: ChatStreamEvent) => void },
    ) => {
      mockSent.push(JSON.stringify(messages));
      if (mockFail) {
        const error = mockFail;
        mockFail = null;
        throw error;
      }
      emitScript(handlers.onEvent);
    },
  ),
}));

import { useChat } from '../src/features/chat/hooks/useChat';

type Api = ReturnType<typeof useChat>;

const Probe: React.FC<{ apiRef: { current?: Api } }> = ({ apiRef }) => {
  apiRef.current = useChat();
  return null;
};

const render = async (): Promise<{ current?: Api }> => {
  const apiRef: { current?: Api } = {};
  let renderer: ReactTestRenderer.ReactTestRenderer | undefined;
  await act(async () => {
    renderer = ReactTestRenderer.create(<Probe apiRef={apiRef} />);
  });
  if (!renderer) throw new Error('no render');
  return apiRef;
};

describe('useChat', () => {
  beforeEach(() => {
    mockSent = [];
    mockFail = null;
  });

  it('starts empty and idle', async () => {
    const api = await render();
    expect(api.current?.turns).toHaveLength(0);
    expect(api.current?.isThinking).toBe(false);
    expect(api.current?.error).toBeNull();
  });

  it('appends the user turn and the streamed reply', async () => {
    const api = await render();
    await act(async () => {
      await api.current?.send('lawn under 5000');
    });
    const turns = api.current?.turns ?? [];
    expect(turns).toHaveLength(2);
    expect(turns[0].role).toBe('user');
    expect(turns[0].content).toBe('lawn under 5000');
    expect(turns[1].role).toBe('assistant');
    expect(turns[1].content).toBe('Try these.');
    expect(turns[1].streaming).toBe(false);
  });

  it('collects the products the assistant suggested', async () => {
    const api = await render();
    await act(async () => {
      await api.current?.send('hi');
    });
    const assistant = (api.current?.turns ?? [])[1];
    expect(assistant.products).toHaveLength(1);
    expect(assistant.products[0].id).toBe('HSY:a');
  });

  it('sends the earlier turns as history', async () => {
    const api = await render();
    await act(async () => {
      await api.current?.send('first');
    });
    await act(async () => {
      await api.current?.send('second');
    });
    const last = JSON.parse(mockSent[mockSent.length - 1]) as { role: string; content: string }[];
    expect(last.map(m => m.content)).toEqual(['first', 'Try these.', 'second']);
  });

  it('ignores an empty message', async () => {
    const api = await render();
    await act(async () => {
      await api.current?.send('   ');
    });
    expect(api.current?.turns).toHaveLength(0);
    expect(mockSent).toHaveLength(0);
  });

  it('surfaces a failure and stops streaming', async () => {
    mockFail = new Error('network down');
    const api = await render();
    await act(async () => {
      await api.current?.send('hi');
    });
    expect(api.current?.error).toBe('network down');
    const assistant = (api.current?.turns ?? [])[1];
    expect(assistant.streaming).toBe(false);
    expect(assistant.failed).toBe(true);
  });

  it('never shows the same suggested product twice', async () => {
    const api = await render();
    await act(async () => {
      await api.current?.send('hi');
    });
    const assistant = (api.current?.turns ?? [])[1];
    const ids = assistant.products.map(p => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('retry resends the failing question with the prior context intact', async () => {
    const api = await render();
    await act(async () => {
      await api.current?.send('first');
    });
    mockFail = new Error('offline');
    await act(async () => {
      await api.current?.send('second');
    });
    expect(api.current?.error).toBe('offline');
    const before = mockSent.length;

    await act(async () => {
      await api.current?.retry();
    });

    const last = JSON.parse(mockSent[mockSent.length - 1]) as { role: string; content: string }[];
    expect(mockSent.length).toBe(before + 1);
    expect(last.map(m => m.content)).toEqual(['first', 'Try these.', 'second']);
    expect(api.current?.error).toBeNull();

    // The failed attempt must not linger as a duplicate bubble.
    const roles = (api.current?.turns ?? []).filter(t => t.role === 'assistant' && t.failed);
    expect(roles).toHaveLength(0);
  });

  it('reset clears the conversation', async () => {
    const api = await render();
    await act(async () => {
      await api.current?.send('hi');
    });
    await act(async () => {
      api.current?.reset();
    });
    expect(api.current?.turns).toHaveLength(0);
  });
});
