import axios from 'axios';
import { API_BASE_URL } from './apiHost';
import { IS_DEV } from './apiLogger';

/**
 * Production-only API client.
 *
 * The base URL is the deployed https API and never changes at runtime: there is
 * no candidate list, no rotation and no environment override. A failure is
 * surfaced to the caller (and to the screen) rather than retried against a
 * different host, so the app can only ever talk to production.
 */
const expoEnv = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env;

export const API_TIMEOUT_MS = 10000;

/**
 * Serve bundled mock data when the API is unreachable, instead of surfacing an
 * error. Off by default.
 *
 * It used to be on unconditionally, which hid a real outage: the API address
 * had changed and every request failed, yet the app kept rendering mock
 * products, so it looked like a working catalogue that simply wasn't Mongo data.
 * Flip this to true only when deliberately working without the backend.
 */
export const USE_MOCK_DATA = expoEnv?.EXPO_PUBLIC_USE_MOCK_DATA === 'true';

// Debug-only: confirms which API a dev build is pointed at.
if (IS_DEV) {
  console.log(`[api] base URL: ${API_BASE_URL} (mock data: ${USE_MOCK_DATA ? 'on' : 'off'})`);
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT_MS,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

type AuthTokenProvider = () => string | null | Promise<string | null>;

let authTokenProvider: AuthTokenProvider | null = null;

/**
 * Register where the access token comes from (secure storage, MMKV, …).
 * Called once at app start; until then requests go out unauthenticated.
 */
export const setAuthTokenProvider = (provider: AuthTokenProvider | null): void => {
  authTokenProvider = provider;
};

apiClient.interceptors.request.use(async (config) => {
  if (authTokenProvider) {
    const token = await authTokenProvider();
    if (token) {
      config.headers.set('Authorization', `Bearer ${token}`);
    }
  }
  return config;
});
