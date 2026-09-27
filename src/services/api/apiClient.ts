import axios from 'axios';
import { NativeModules } from 'react-native';
import { buildApiBaseUrlCandidates, parseDevServerHost } from './apiHost';

/**
 * The API is the MongoDB-backed backend running on this Mac.
 *
 * The Mac's address is DHCP-assigned and has changed more than once during
 * development, which broke every request until the bundle was rebuilt. The
 * client therefore keeps an ordered list of candidates and rotates on a
 * network-level failure, and takes the first candidate from the Metro dev
 * server that served the bundle, so the machine's current address is used
 * without anything being hardcoded.
 *
 * Set EXPO_PUBLIC_API_URL to pin a single address and skip rotation entirely.
 */
const expoEnv = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env;

interface SourceCodeModule {
  getConstants?: () => { scriptURL?: string };
  scriptURL?: string;
}

/**
 * The URL of the bundle the app is running. Absent in release builds, and
 * possibly in this runtime, so every access is guarded.
 */
const readScriptUrl = (): string | null => {
  try {
    const sourceCode = (NativeModules as Record<string, unknown>).SourceCode as
      | SourceCodeModule
      | undefined;
    return sourceCode?.getConstants?.().scriptURL ?? sourceCode?.scriptURL ?? null;
  } catch {
    return null;
  }
};

const devServerHost = parseDevServerHost(readScriptUrl());

const API_BASE_URL_CANDIDATES = buildApiBaseUrlCandidates({
  override: expoEnv?.EXPO_PUBLIC_API_URL,
  devServerHost,
});

export const LAN_API_BASE_URL = API_BASE_URL_CANDIDATES[0];

let activeBaseUrlIndex = 0;
/**
 * The candidate that last answered. Rotation returns here once the list is
 * exhausted, so a single bad address cannot strand the app on an unreachable
 * host for the rest of the session.
 */
let lastHealthyIndex = 0;

export const currentApiBaseUrl = (): string => API_BASE_URL_CANDIDATES[activeBaseUrlIndex];

/** Records that the current candidate works, so it is preferred from now on. */
export const markApiBaseUrlHealthy = (): void => {
  lastHealthyIndex = activeBaseUrlIndex;
};

const applyBaseUrl = (index: number): string => {
  activeBaseUrlIndex = index;
  const url = API_BASE_URL_CANDIDATES[index];
  apiClient.defaults.baseURL = url;
  return url;
};

/**
 * Point the client at the next candidate after a network-level failure.
 *
 * After the last candidate it returns to the one that last worked instead of
 * giving up, because the usual cause is the Mac changing address, and that
 * resolves itself once the correct candidate is retried.
 */
export const rotateApiBaseUrl = (): string => {
  const next = activeBaseUrlIndex + 1;
  if (next < API_BASE_URL_CANDIDATES.length) {
    const url = applyBaseUrl(next);
    console.log(`[api] network unreachable, switching base URL to: ${url}`);
    return url;
  }
  const url = applyBaseUrl(lastHealthyIndex);
  console.log(
    `[api] network unreachable on every candidate, returning to last working base URL: ${url}`,
  );
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
  })` +
    `\n[api] host source: ${
      devServerHost ? `metro dev server (${devServerHost})` : 'no dev server host, using last known address'
    }` +
    `\n[api] fallback candidates: ${API_BASE_URL_CANDIDATES.slice(1).join(', ') || 'none'}`,
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
