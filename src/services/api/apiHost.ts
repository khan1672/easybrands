/**
 * Which host should the API client talk to?
 *
 * The backend runs on the development Mac, whose address is DHCP-assigned and
 * has changed repeatedly during this project, including onto a different subnet
 * entirely. Hardcoding it broke every request each time, so the address is
 * derived from the Metro dev server the bundle was loaded from: Metro always
 * runs on the same machine as the API, so its host is the machine's current
 * address, whatever DHCP handed out today.
 *
 * There is deliberately no hardcoded LAN fallback. A stale address does not
 * refuse the connection, it hangs, so every candidate would burn the full
 * request timeout before the next one was tried. A release build has to supply
 * EXPO_PUBLIC_API_URL instead.
 */

const API_PORT = 8787;
const API_PATH = '/api/v1';

/** The Android emulator maps 10.0.2.2 to the host machine's loopback. */
export const ANDROID_EMULATOR_HOST = '10.0.2.2';
/** iOS simulator and web share the host's network stack. */
export const LOOPBACK_HOSTS = ['127.0.0.1', 'localhost'] as const;

/**
 * Host and port of the dev server that served the JS bundle, or null when the
 * bundle was not loaded from one (a release build, or the module is missing in
 * this runtime).
 */
export const parseDevServerHost = (scriptUrl: string | null | undefined): string | null => {
  if (typeof scriptUrl !== 'string' || scriptUrl.length === 0) {
    return null;
  }
  const match = /^https?:\/\/(\[[0-9a-fA-F:]+\]|[^/:?#]+)/.exec(scriptUrl);
  const host = match?.[1];
  if (!host || host.length === 0) {
    return null;
  }
  // A loopback bundle means the bundle came from the device itself, which tells
  // us nothing about where the Mac is.
  if (LOOPBACK_HOSTS.includes(host as (typeof LOOPBACK_HOSTS)[number])) {
    return null;
  }
  return host;
};

export interface CandidateOptions {
  /** EXPO_PUBLIC_API_URL: pins one address and disables rotation. */
  override?: string | undefined;
  /** Host of the Metro dev server, if the bundle came from one. */
  devServerHost?: string | null | undefined;
}

const toBaseUrl = (host: string): string => `http://${host}:${API_PORT}${API_PATH}`;

/**
 * Ordered candidates, best first. An explicit override always wins and is the
 * only entry, so a deliberate pin is never second-guessed.
 */
export const buildApiBaseUrlCandidates = ({
  override,
  devServerHost,
}: CandidateOptions): string[] => {
  if (typeof override === 'string' && override.trim().length > 0) {
    return [override.trim()];
  }

  const hosts: string[] = [];
  const add = (host: string | null | undefined): void => {
    if (typeof host === 'string' && host.length > 0 && !hosts.includes(host)) {
      hosts.push(host);
    }
  };

  add(devServerHost);
  add(ANDROID_EMULATOR_HOST);
  for (const loopback of LOOPBACK_HOSTS) {
    add(loopback);
  }

  return hosts.map(toBaseUrl);
};
