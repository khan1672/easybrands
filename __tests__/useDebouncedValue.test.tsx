/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { useDebouncedValue } from '../src/hooks/useDebouncedValue';

const Probe: React.FC<{ value: string; delayMs: number; onRender: (v: string) => void }> = ({
  value,
  delayMs,
  onRender,
}) => {
  const debounced = useDebouncedValue(value, delayMs);
  onRender(debounced);
  return null;
};

const render = (value: string, delayMs: number, onRender: (v: string) => void) => {
  let renderer: ReturnType<typeof ReactTestRenderer.create> | undefined;
  ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(<Probe value={value} delayMs={delayMs} onRender={onRender} />);
  });
  return {
    update: (next: string) => {
      ReactTestRenderer.act(() => {
        renderer?.update(<Probe value={next} delayMs={delayMs} onRender={onRender} />);
      });
    },
    unmount: () => renderer?.unmount(),
  };
};

describe('useDebouncedValue', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('holds the previous value until the delay elapses', () => {
    const seen: string[] = [];
    const { update, unmount } = render('lawn', 300, v => seen.push(v));

    update('lawn ');
    update('lawn s');
    // Still the original value: no timer has fired yet.
    expect(seen[seen.length - 1]).toBe('lawn');

    ReactTestRenderer.act(() => {
      jest.advanceTimersByTime(299);
    });
    expect(seen[seen.length - 1]).toBe('lawn');

    ReactTestRenderer.act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(seen[seen.length - 1]).toBe('lawn s');
    unmount();
  });

  it('collapses a burst of keystrokes into a single settled value', () => {
    const seen: string[] = [];
    const { update, unmount } = render('', 300, v => seen.push(v));

    for (const q of ['l', 'la', 'law', 'lawn']) {
      update(q);
      ReactTestRenderer.act(() => {
        jest.advanceTimersByTime(50);
      });
    }
    ReactTestRenderer.act(() => {
      jest.advanceTimersByTime(300);
    });
    expect(seen[seen.length - 1]).toBe('lawn');
    unmount();
  });

  it('passes the value straight through when the delay is zero', () => {
    const seen: string[] = [];
    const { update, unmount } = render('a', 0, v => seen.push(v));
    update('lawn');
    expect(seen[seen.length - 1]).toBe('lawn');
    unmount();
  });

  it('does not update after unmount', () => {
    const seen: string[] = [];
    const { update, unmount } = render('a', 300, v => seen.push(v));
    update('b');
    unmount();
    const countAfterUnmount = seen.length;
    ReactTestRenderer.act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(seen.length).toBe(countAfterUnmount);
  });
});
