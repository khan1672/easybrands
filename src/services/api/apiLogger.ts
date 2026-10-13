/**
 * Request/response console for the API layer.
 *
 * Every call made through `apiRequest` is printed here so you can see exactly
 * what leaves the device and what comes back, with status and duration.
 * Entries are also kept in a bounded in-memory buffer so an on-device debug
 * screen can render the same history (see `subscribe`).
 */

export type ApiLogDirection = 'request' | 'response' | 'error';

export interface ApiLogError {
  message: string;
  code?: string;
  details?: unknown;
}

export interface ApiLogEntry {
  id: string;
  direction: ApiLogDirection;
  method: string;
  url: string;
  status?: number;
  statusText?: string;
  durationMs?: number;
  params?: unknown;
  requestBody?: unknown;
  responseBody?: unknown;
  error?: ApiLogError;
  createdAt: string;
}

const MAX_ENTRIES = 100;

/**
 * ANSI colours for the console blocks: requests yellow, responses green, errors
 * red. These are plain escape codes rather than a UI concern, so they are not
 * theme tokens, and they are only ever emitted while the logger is enabled
 * (dev builds) — production bundles never carry them.
 */
const ANSI_RESET = '\u001b[0m';
const ANSI = {
  bold: '\u001b[1m',
  red: '\u001b[31m',
  green: '\u001b[32m',
  yellow: '\u001b[33m',
} as const;

const paint = (colour: string, text: string): string => `${colour}${text}${ANSI_RESET}`;

const SENSITIVE_KEY = /token|password|passwd|secret|authorization|cookie|api[-_]?key|session|otp|pin/i;
const REDACTED = '***REDACTED***';

/**
 * Console output is a debug-only affordance. `__DEV__` is `false` (and folded
 * away) in release builds, so the blocks never print — and `setEnabled` cannot
 * re-enable them outside debug.
 */
export const IS_DEV = typeof __DEV__ !== 'undefined' ? __DEV__ : false;

let enabled = IS_DEV;
let entries: ApiLogEntry[] = [];
let sequence = 0;
const listeners = new Set<() => void>();

const nowIso = (): string => new Date().toISOString();

const nextId = (): string => {
  sequence += 1;
  return `${Date.now().toString(36)}-${sequence.toString(36)}`;
};

/**
 * Pretty-prints the full payload — nothing is truncated, so the console shows
 * exactly what was sent and received. Credentials are still masked, and a
 * circular reference degrades to `[circular]` instead of throwing.
 */
const stringify = (value: unknown): string => {
  if (value === undefined) return '(none)';
  const seen = new WeakSet<object>();
  try {
    const json = JSON.stringify(
      value,
      (key, item) => {
        if (SENSITIVE_KEY.test(key)) return REDACTED;
        if (item !== null && typeof item === 'object') {
          if (seen.has(item)) return '[circular]';
          seen.add(item);
        }
        return item;
      },
      2,
    );
    return json ?? String(value);
  } catch {
    return '[unserialisable]';
  }
};

const BANNERS: Record<ApiLogDirection, { title: string; rule: string }> = {
  request: { title: '--------- API REQUEST ---------', rule: '-------------------------------' },
  response: { title: '--------- RESPONSE ------------', rule: '------------------------------' },
  error: { title: '--------- ERROR ------------', rule: '---------------------------' },
};

const DIRECTION_COLOUR: Record<ApiLogDirection, string> = {
  request: ANSI.yellow,
  response: ANSI.green,
  error: ANSI.red,
};

const print = (entry: ApiLogEntry): void => {
  if (!IS_DEV || !enabled) return;

  const colour = DIRECTION_COLOUR[entry.direction];
  const banner = BANNERS[entry.direction];
  const status = entry.status !== undefined ? String(entry.status) : '---';
  // The URL stays uncoloured so it is easy to read and copy.
  const field = (label: string, value: string, plainValue = false): string =>
    `${paint(colour, label)} ${plainValue ? value : paint(colour, value)}`;

  const lines: string[] = [paint(ANSI.bold + colour, banner.title)];

  if (entry.direction === 'request') {
    lines.push(field('METHOD:', entry.method));
    lines.push(field('URL:', entry.url, true));
    if (entry.params !== undefined) lines.push(field('PARAMS:', stringify(entry.params)));
    if (entry.requestBody !== undefined) lines.push(field('BODY:', stringify(entry.requestBody)));
  } else if (entry.direction === 'response') {
    lines.push(field('URL:', entry.url, true));
    lines.push(field('STATUS:', status));
    if (entry.responseBody !== undefined) lines.push(field('RESPONSE:', stringify(entry.responseBody)));
  } else {
    lines.push(field('URL:', entry.url, true));
    lines.push(field('STATUS:', status));
    lines.push(
      field(
        'ERROR:',
        stringify({
          message: entry.error?.message,
          code: entry.error?.code,
          details: entry.error?.details,
        }),
      ),
    );
  }

  lines.push(paint(ANSI.bold + colour, banner.rule));

  const block = lines.join('\n');
  if (entry.direction === 'error') console.error(block);
  else console.log(block);
};

const record = (entry: ApiLogEntry): ApiLogEntry => {
  if (!IS_DEV) return entry;
  entries = [entry, ...entries].slice(0, MAX_ENTRIES);
  listeners.forEach((listener) => listener());
  print(entry);
  return entry;
};

export interface ApiLogger {
  /** Turns console output on/off. Buffer capture is unaffected. */
  setEnabled(value: boolean): void;
  isEnabled(): boolean;
  logRequest(input: { method: string; url: string; params?: unknown; body?: unknown }): ApiLogEntry;
  logResponse(input: {
    method: string;
    url: string;
    status?: number;
    statusText?: string;
    durationMs: number;
    body?: unknown;
  }): ApiLogEntry;
  logError(input: {
    method: string;
    url: string;
    durationMs: number;
    status?: number;
    statusText?: string;
    error: ApiLogError;
  }): ApiLogEntry;
  /** Newest first. */
  getEntries(): ApiLogEntry[];
  clear(): void;
  /** Notifies on every new entry — pair with React's `useSyncExternalStore`. */
  subscribe(listener: () => void): () => void;
  getSnapshot(): ApiLogEntry[];
}

export const apiLogger: ApiLogger = {
  setEnabled(value: boolean): void {
    enabled = value;
  },

  isEnabled(): boolean {
    return enabled;
  },

  logRequest({ method, url, params, body }): ApiLogEntry {
    return record({
      id: nextId(),
      direction: 'request',
      method,
      url,
      params,
      requestBody: body,
      createdAt: nowIso(),
    });
  },

  logResponse({ method, url, status, statusText, durationMs, body }): ApiLogEntry {
    return record({
      id: nextId(),
      direction: 'response',
      method,
      url,
      status,
      statusText,
      durationMs,
      responseBody: body,
      createdAt: nowIso(),
    });
  },

  logError({ method, url, durationMs, status, statusText, error }): ApiLogEntry {
    return record({
      id: nextId(),
      direction: 'error',
      method,
      url,
      status,
      statusText,
      durationMs,
      error,
      createdAt: nowIso(),
    });
  },

  getEntries(): ApiLogEntry[] {
    return entries;
  },

  clear(): void {
    entries = [];
    listeners.forEach((listener) => listener());
  },

  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  getSnapshot(): ApiLogEntry[] {
    return entries;
  },
};
