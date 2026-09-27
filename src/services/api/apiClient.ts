import axios from 'axios';

/**
 * The API is the MongoDB-backed backend running on this Mac. The phone must
 * use the Mac's LAN address (127.0.0.1 would be the phone itself).
 * Override with EXPO_PUBLIC_API_URL when the DHCP address changes.
 */
const expoEnv = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env;

export const LAN_API_BASE_URL = expoEnv?.EXPO_PUBLIC_API_URL ?? 'http://192.168.1.25:8787/api/v1';

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

// Printed once at startup so the address in use is always visible in Metro.
console.log(`[api] base URL: ${LAN_API_BASE_URL} (mock data: ${USE_MOCK_DATA ? 'on' : 'off'})`);

export const apiClient = axios.create({
  baseURL: LAN_API_BASE_URL,
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
