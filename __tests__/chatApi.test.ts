/**
 * @format
 */

import {
  takeSseFrames,
  parseSseFrame,
  type ChatStreamEvent,
} from '../src/services/api/chatApi';

const frame = (event: ChatStreamEvent): string => `data: ${JSON.stringify(event)}\n\n`;

describe('takeSseFrames', () => {
  it('returns complete frames and keeps the partial remainder', () => {
    const { frames, rest } = takeSseFrames('data: {"type":"delta","text":"a"}\n\ndata: {"type":"do');
    expect(frames).toHaveLength(1);
    expect(rest).toBe('data: {"type":"do');
  });

  it('returns nothing when no frame has been completed', () => {
    const { frames, rest } = takeSseFrames('data: {"type":"delta","text":"a"}');
    expect(frames).toHaveLength(0);
    expect(rest).toBe('data: {"type":"delta","text":"a"}');
  });
});

describe('parseSseFrame', () => {
  it('parses a delta event', () => {
    expect(parseSseFrame(frame({ type: 'delta', text: 'hello' }))).toEqual({
      type: 'delta',
      text: 'hello',
    });
  });

  it('parses a products event', () => {
    const event = parseSseFrame(
      frame({ type: 'products', products: [{ id: 'A:b', name: 'N', brand: 'A', price: 10, currency: 'PKR', category: 'C', inStock: true }] }),
    );
    expect(event?.type).toBe('products');
  });

  it('ignores a half-written frame rather than throwing', () => {
    expect(parseSseFrame('data: {"type":"del')).toBeNull();
  });

  it('ignores frames that are not chat events', () => {
    expect(parseSseFrame('data: {"hello":"world"}\n\n')).toBeNull();
  });

  it('tolerates comments and blank lines', () => {
    expect(parseSseFrame(': keep-alive\n\ndata: {"type":"done"}\n\n')).toEqual({ type: 'done' });
  });
});

describe('reassembling a streamed reply', () => {
  it('rebuilds the text from many deltas', () => {
    const stream = 'Hel' + 'lo ' + 'world';
    const buffer = stream
      .split('')
      .map(ch => frame({ type: 'delta', text: ch }))
      .join('');
    const { frames, rest } = takeSseFrames(buffer);
    const text = frames
      .map(f => parseSseFrame(f))
      .filter((e): e is ChatStreamEvent => e?.type === 'delta')
      .map(e => (e as { text: string }).text)
      .join('');
    expect(text).toBe('Hello world');
    expect(rest).toBe('');
  });
});
