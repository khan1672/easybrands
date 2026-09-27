import type { AxiosError, AxiosRequestConfig, Method } from 'axios';

import { apiClient, LAN_API_BASE_URL, USE_MOCK_DATA } from './apiClient';
import { apiLogger } from './apiLogger';

export type QueryParams = Record<string, string | number | boolean | undefined | null>;

export interface ApiRequestConfig {
  /** Path relative to the API base URL, e.g. `/products`. */
  url: string;
  method?: Method;
  params?: QueryParams;
  body?: unknown;
  timeoutMs?: number;
  signal?: AbortSignal;
  /** Overrides the logged label; useful to tell duplicate calls apart. */
  label?: string;
}

export interface ApiRequestResult<T> {
  data: T;
  status: number;
  statusText: string;
  durationMs: number;
  headers: Record<string, string>;
}

/** Every failure leaves this service in the same shape, whatever the cause. */
export class ApiError extends Error {
  readonly status: number | undefined;
  readonly statusText: string | undefined;
  readonly code: string | undefined;
  readonly details: unknown;
  readonly isNetworkError: boolean;
  readonly isTimeout: boolean;
  readonly url: string;
  readonly method: string;
  readonly durationMs: number;

  constructor(input: {
    message: string;
    status?: number;
    statusText?: string;
    code?: string;
    details?: unknown;
    isNetworkError?: boolean;
    isTimeout?: boolean;
    url: string;
    method: string;
    durationMs: number;
  }) {
    super(input.message);
    this.name = 'ApiError';
    this.status = input.status;
    this.statusText = input.statusText;
    this.code = input.code;
    this.details = input.details;
    this.isNetworkError = input.isNetworkError ?? false;
    this.isTimeout = input.isTimeout ?? false;
    this.url = input.url;
    this.method = input.method;
    this.durationMs = input.durationMs;
  }

  /** True when retrying later could plausibly succeed. */
  get isRetryable(): boolean {
    return this.isNetworkError || this.isTimeout || this.status === undefined || this.status >= 500;
  }
}

const toQueryString = (params?: QueryParams): string => {
  if (!params) return '';
  const parts: string[] = [];
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
  }
  return parts.length ? `?${parts.join('&')}` : '';
};

/** Only the path + query is logged — never the host, so nothing leaks in logs. */
const describeUrl = (url: string, params?: QueryParams): string => `${url}${toQueryString(params)}`;

const headersToRecord = (raw: unknown): Record<string, string> => {
  if (raw === null || typeof raw !== 'object') return {};
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    out[key] = String(value);
  }
  return out;
};

const describeAxiosError = (error: AxiosError): { message: string; code?: string; status?: number; statusText?: string; details?: unknown; isNetworkError: boolean; isTimeout: boolean } => {
  const status = error.response?.status;
  const statusText = error.response?.statusText;
  const data = error.response?.data as { error?: { message?: string; code?: string } } | undefined;
  const isNetworkError = error.code === 'ERR_NETWORK' || (!error.response && error.code !== 'ECONNABORTED');
  const isTimeout = error.code === 'ECONNABORTED';

  let message = data?.error?.message ?? statusText ?? error.message ?? 'Request failed';
  if (isTimeout) message = `Request timed out after ${error.config?.timeout ?? 0}ms`;
  else if (isNetworkError) {
    message = `Network unreachable — is the API running and reachable at ${LAN_API_BASE_URL}?`;
  } else if (status !== undefined) {
    message = `${status} ${statusText ?? ''}`.trim();
  }

  return {
    message,
    code: data?.error?.code ?? error.code ?? undefined,
    status,
    statusText,
    details: data?.error ?? (status !== undefined ? data : undefined),
    isNetworkError,
    isTimeout,
  };
};

const toApiError = (error: unknown, context: { method: string; url: string; durationMs: number }): ApiError => {
  if (error instanceof ApiError) return error;

  if (error !== null && typeof error === 'object' && (error as AxiosError).isAxiosError) {
    const axiosError = error as AxiosError;
    const described = describeAxiosError(axiosError);
    return new ApiError({
      ...described,
      url: describeUrl(context.url),
      method: context.method,
      durationMs: context.durationMs,
    });
  }

  const message = error instanceof Error ? error.message : 'Request failed';
  return new ApiError({
    message,
    url: describeUrl(context.url),
    method: context.method,
    durationMs: context.durationMs,
  });
};

/**
 * The single entry point for every HTTP call in the app.
 *
 * Handles the URL, query string, timeout, cancellation, auth header, logging
 * and error normalisation, so feature code never touches Axios directly.
 */
export const apiRequest = async <T>(config: ApiRequestConfig): Promise<ApiRequestResult<T>> => {
  const method = (config.method ?? 'GET').toUpperCase();
  const label = config.label ?? describeUrl(config.url, config.params);
  const startedAt = Date.now();

  apiLogger.logRequest({ method, url: label, params: config.params, body: config.body });

  const axiosConfig: AxiosRequestConfig = {
    ...(config.params ? { params: config.params } : {}),
    ...(config.timeoutMs !== undefined ? { timeout: config.timeoutMs } : {}),
    ...(config.signal ? { signal: config.signal } : {}),
    ...(config.body !== undefined ? { data: config.body } : {}),
  };

  try {
    const response = await apiClient.request<T>({ url: config.url, method, ...axiosConfig });
    const durationMs = Date.now() - startedAt;

    apiLogger.logResponse({
      method,
      url: label,
      status: response.status,
      statusText: response.statusText,
      durationMs,
      body: response.data,
    });

    return {
      data: response.data,
      status: response.status,
      statusText: response.statusText,
      durationMs,
      headers: headersToRecord(response.headers),
    };
  } catch (error) {
    const durationMs = Date.now() - startedAt;
    const apiError = toApiError(error, { method, url: config.url, durationMs });

    apiLogger.logError({
      method,
      url: label,
      durationMs,
      status: apiError.status,
      statusText: apiError.statusText,
      error: { message: apiError.message, code: apiError.code, details: apiError.details },
    });

    throw apiError;
  }
};

export const apiGet = <T>(url: string, config: Omit<ApiRequestConfig, 'url' | 'method'> = {}): Promise<ApiRequestResult<T>> =>
  apiRequest<T>({ ...config, url, method: 'GET' });

export const apiPost = <T>(url: string, body?: unknown, config: Omit<ApiRequestConfig, 'url' | 'method' | 'body'> = {}): Promise<ApiRequestResult<T>> =>
  apiRequest<T>({ ...config, url, method: 'POST', body });

export const apiPut = <T>(url: string, body?: unknown, config: Omit<ApiRequestConfig, 'url' | 'method' | 'body'> = {}): Promise<ApiRequestResult<T>> =>
  apiRequest<T>({ ...config, url, method: 'PUT', body });

export const apiPatch = <T>(url: string, body?: unknown, config: Omit<ApiRequestConfig, 'url' | 'method' | 'body'> = {}): Promise<ApiRequestResult<T>> =>
  apiRequest<T>({ ...config, url, method: 'PATCH', body });

export const apiDelete = <T>(url: string, config: Omit<ApiRequestConfig, 'url' | 'method'> = {}): Promise<ApiRequestResult<T>> =>
  apiRequest<T>({ ...config, url, method: 'DELETE' });

export const isNetworkError = (error: unknown): boolean =>
  error instanceof ApiError ? error.isNetworkError : false;

/**
 * Returns `mock` for a network failure, but only when `USE_MOCK_DATA` is on.
 * Otherwise the error is rethrown so the screen shows its error state instead
 * of quietly rendering fake data.
 */
export const mockFallback = <T>(error: unknown, mock: T, label: string): T => {
  if (USE_MOCK_DATA && isNetworkError(error)) {
    console.warn(
      `[api] ${label}: cannot reach ${LAN_API_BASE_URL}, serving mock data because ` +
        'EXPO_PUBLIC_USE_MOCK_DATA=true. Unset it to see real API failures.',
    );
    return mock;
  }
  throw error;
};
