/**
 * @format
 */

import { API_BASE_URL } from '../src/services/api/apiHost';

describe('API_BASE_URL', () => {
  it('is the deployed API over https', () => {
    expect(API_BASE_URL).toBe('https://easybrands-backend.vercel.app/api/v1');
    expect(API_BASE_URL.startsWith('https://')).toBe(true);
  });

  /**
   * The app must never fall back to a local or IP-based host: those addresses
   * only exist on a developer's machine, and a phone that tried one would hang
   * or fail instead of reporting a real error.
   */
  it('contains no local, loopback, emulator or plaintext host', () => {
    const forbidden = ['localhost', '127.0.0.1', '10.0.2.2', '192.168.', 'http://'];
    for (const needle of forbidden) {
      expect(API_BASE_URL.includes(needle)).toBe(false);
    }
  });
});
