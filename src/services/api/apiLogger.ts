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
const MAX_ARRAY_PREVIEW = 5;
const MAX_KEYS_PREVIEW = 15;
const MAX_STRING_LENGTH = 240;

const SENSITIVE_KEY = /token|password|passwd|secret|authorization|cookie|api[-_]?key|session|otp|pin/i;
const REDACTED = '***REDACTED***';

let enabled = typeof __DEV__ !== 'undefined' ? __DEV__ : true;
let entries: ApiLogEntry[] = [];
let sequence = 0;
const listeners = new Set<() => void>();

const nowIso = (): string => new Date().toISOString();

const nextId = (): string => {
  sequence += 1;
  return `${Date.now().toString(36)}-${sequence.toString(36)}`;
};

const truncateString = (value: string): string =>
  value.length > MAX_STRING_LENGTH ? `${value.slice(0, MAX_STRING_LENGTH)}… (+${value.length - MAX_STRING_LENGTH} chars)` : value;

/** Never print credentials — replaces sensitive values before logging. */
const redact = (value: unknown, depth = 0): unknown => {
  if (value === null || value === undefined) return value;
  if (typeof value === 'string') return truncateString(value);
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  if (depth > 6) return '[deep]';

  if (Array.isArray(value)) {
    const preview = value.slice(0, MAX_ARRAY_PREVIEW).map((item) => redact(item, depth + 1));
    return value.length > MAX_ARRAY_PREVIEW
      ? [...preview, `… +${value.length - MAX_ARRAY_PREVIEW} more items`]
      : preview;
  }

  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    const entriesOfObject = Object.entries(value as Record<string, unknown>);
    for (const [key, item] of entriesOfObject.slice(0, MAX_KEYS_PREVIEW)) {
      out[key] = SENSITIVE_KEY.test(key) ? REDACTED : redact(item, depth + 1);
    }
    if (entriesOfObject.length > MAX_KEYS_PREVIEW) {
      out['…'] = `+${entriesOfObject.length - MAX_KEYS_PREVIEW} more keys`;
    }
    return out;
  }

  return String(value);
};

const stringify = (value: unknown): string => {
  if (value === undefined) return '(none)';
  try {
    return truncateString(JSON.stringify(redact(value), null, 2) ?? String(value));
  } catch {
    return '[unserialisable]';
  }
};

const print = (entry: ApiLogEntry): void => {
  if (!enabled) return;

  const target = entry.url;
  const head =
    entry.direction === 'request'
      ? `▶ ${entry.method} ${target}`
      : entry.direction === 'response'
        ? `◀ ${entry.status ?? '---'} ${entry.method} ${target} — ${entry.durationMs ?? 0}ms`
        : `✕ ${entry.method} ${target} — ${entry.error?.message ?? 'failed'}`;

  const lines = [`[api] ${head}`];
  if (entry.direction === 'request') {
    if (entry.params !== undefined) lines.push(`     params   ${stringify(entry.params)}`);
    if (entry.requestBody !== undefined) lines.push(`     body     ${stringify(entry.requestBody)}`);
  } else {
    if (entry.responseBody !== undefined) lines.push(`     response ${stringify(entry.responseBody)}`);
    if (entry.error) {
      if (entry.error.code) lines.push(`     code     ${entry.error.code}`);
      if (entry.error.details !== undefined) lines.push(`     details  ${stringify(entry.error.details)}`);
    }
  }

  const [headline, ...details] = lines;
  if (entry.direction === 'error') {
    console.error(lines.join('\n'));
  } else if (typeof console.groupCollapsed === 'function') {
    console.groupCollapsed(headline);
    for (const detail of details) console.log(detail);
    console.groupEnd();
  } else {
    console.log(lines.join('\n'));
  }
};

const record = (entry: ApiLogEntry): ApiLogEntry => {
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
