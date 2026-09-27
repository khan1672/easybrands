import axios from 'axios';

/**
 * The API is the MongoDB-backed backend running on this Mac.
 *
 * The Mac's address is DHCP-assigned and has already changed once during
 * development, which broke every request until the bundle was rebuilt. Rather
 * than hardcoding one address and rediscovering that problem each time, the
 * client keeps an ordered list of candidates and rotates to the next one when a
 * request fails at the network level. An emulator, a physical device on the same
 * Wi-Fi, and a localhost-only setup are therefore all covered without any
 * rebuild.
 *
 * Set EXPO_PUBLIC_API_URL to pin a single address and skip rotation entirely.
 */
const expoEnv = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env;

const API_PORT = 8787;
const API_PATH = '/api/v1';
/** Most recently observed Mac address; the first candidate. */
const DEFAULT_LAN_HOST = '192.168.1.16';
/** The Android emulator maps 10.0.2.2 to the host machine's loopback. */
const ANDROID_EMULATOR_HOST = '10.0.2.2';
/** iOS simulator and web share the host's network stack. */
const LOOPBACK_HOSTS = ['127.0.0.1', 'localhost'];

const buildCandidates = (): string[] => {
  const override = expoEnv?.EXPO_PUBLIC_API_URL;
  if (override) {
    return [override];
  }
  return [DEFAULT_LAN_HOST, ANDROID_EMULATOR_HOST, ...LOOPBACK_HOSTS].map(
    host => `http://${host}:${API_PORT}${API_PATH}`,
  );
};

const API_BASE_URL_CANDIDATES = buildCandidates();

export const LAN_API_BASE_URL = API_BASE_URL_CANDIDATES[0];

let activeBaseUrlIndex = 0;

export const currentApiBaseUrl = (): string => API_BASE_URL_CANDIDATES[activeBaseUrlIndex];

/**
 * Point the client at the next candidate after a network-level failure.
 * Returns null once the list is exhausted, so callers can stop retrying.
 */
export const rotateApiBaseUrl = (): string | null => {
  const next = activeBaseUrlIndex + 1;
  if (next >= API_BASE_URL_CANDIDATES.length) {
    return null;
  }
  activeBaseUrlIndex = next;
  const url = API_BASE_URL_CANDIDATES[next];
  apiClient.defaults.baseURL = url;
  console.log(`[api] network unreachable, switching base URL to: ${url}`);
  return url;
};

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
console.log(
  `[api] base URL: ${LAN_API_BASE_URL} (mock data: ${
    USE_MOCK_DATA ? 'on' : 'off'
  })\n[api] fallback candidates: ${API_BASE_URL_CANDIDATES.slice(1).join(', ') || 'none'}`,
);

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
