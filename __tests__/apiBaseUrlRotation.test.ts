/**
 * @format
 */

/**
 * The client keeps the candidate list in module state, so each test reloads the
 * module to start from the first candidate.
 */
const loadClient = (): {
  currentApiBaseUrl: () => string;
  rotateApiBaseUrl: () => string;
  markApiBaseUrlHealthy: () => void;
} => {
  let mod: typeof import('../src/services/api/apiClient');
  jest.isolateModules(() => {
    mod = require('../src/services/api/apiClient');
  });
  return mod!;
};

describe('api base URL rotation', () => {
  const LAN = `http://${require('../src/services/api/apiHost').LAST_KNOWN_LAN_HOST}:8787/api/v1`;
  const EMULATOR = 'http://10.0.2.2:8787/api/v1';
  const LOOPBACK = 'http://127.0.0.1:8787/api/v1';

  it('starts on the first candidate', () => {
    const client = loadClient();
    expect(client.currentApiBaseUrl()).toBe(LAN);
  });

  it('moves to the next candidate on a network failure', () => {
    const client = loadClient();
    expect(client.rotateApiBaseUrl()).toBe(EMULATOR);
    expect(client.currentApiBaseUrl()).toBe(EMULATOR);
  });

  /**
   * The bug this guards: rotation used to run off the end of the list and stay
   * on the final candidate (localhost, which on a phone is the phone itself),
   * so every later request failed and the working address was never retried.
   */
  it('comes back to the working address instead of getting stuck on the last candidate', () => {
    const client = loadClient();
    const seen = [client.currentApiBaseUrl()];
    for (let i = 0; i < 6; i++) {
      seen.push(client.rotateApiBaseUrl());
    }
    expect(seen).toContain(LAN);
    expect(seen.filter(url => url === LOOPBACK).length).toBeLessThan(3);
  });

  it('always returns a usable base URL, never null', () => {
    const client = loadClient();
    for (let i = 0; i < 8; i++) {
      expect(typeof client.rotateApiBaseUrl()).toBe('string');
    }
  });

  it('remembers the candidate that answered and returns to it', () => {
    const client = loadClient();
    client.rotateApiBaseUrl();
    expect(client.currentApiBaseUrl()).toBe(EMULATOR);
    // The emulator answered, so exhaustion should come back here.
    client.markApiBaseUrlHealthy();

    let url = client.currentApiBaseUrl();
    for (let i = 0; i < 3; i++) {
      url = client.rotateApiBaseUrl();
    }
    expect(url).toBe(EMULATOR);
  });
});
