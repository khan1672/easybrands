/**
 * @format
 */

import {
  ANDROID_EMULATOR_HOST,
  LAST_KNOWN_LAN_HOST,
  buildApiBaseUrlCandidates,
  parseDevServerHost,
} from '../src/services/api/apiHost';

const PORT = '8787/api/v1';

describe('parseDevServerHost', () => {
  it('takes the host out of the bundle URL Metro served', () => {
    expect(
      parseDevServerHost('http://192.168.1.17:8081/index.bundle?platform=android&dev=true'),
    ).toBe('192.168.1.17');
  });

  it('handles https and a host without a port', () => {
    expect(parseDevServerHost('https://10.0.2.2:8081/index.bundle')).toBe('10.0.2.2');
    expect(parseDevServerHost('http://192.168.1.17/index.bundle')).toBe('192.168.1.17');
  });

  /**
   * A loopback bundle URL means the bundle was served by the device itself,
   * which says nothing about where the Mac is, so it must not be trusted.
   */
  it('ignores a loopback bundle URL', () => {
    expect(parseDevServerHost('http://localhost:8081/index.bundle')).toBeNull();
    expect(parseDevServerHost('http://127.0.0.1:8081/index.bundle')).toBeNull();
  });

  it('returns null when there is no dev server', () => {
    expect(parseDevServerHost(null)).toBeNull();
    expect(parseDevServerHost(undefined)).toBeNull();
    expect(parseDevServerHost('')).toBeNull();
    expect(parseDevServerHost('file:///index.bundle')).toBeNull();
    expect(parseDevServerHost('not a url')).toBeNull();
  });
});

describe('buildApiBaseUrlCandidates', () => {
  it('puts the dev server host first, so a DHCP change needs no rebuild', () => {
    const candidates = buildApiBaseUrlCandidates({ devServerHost: '192.168.1.42' });
    expect(candidates[0]).toBe(`http://192.168.1.42:${PORT}`);
  });

  it('keeps emulator and loopback fallbacks after the real address', () => {
    const candidates = buildApiBaseUrlCandidates({ devServerHost: '192.168.1.42' });
    expect(candidates).toContain(`http://${ANDROID_EMULATOR_HOST}:${PORT}`);
    expect(candidates).toContain('http://127.0.0.1:' + PORT);
    expect(candidates).toContain('http://localhost:' + PORT);
  });

  it('falls back to the last known address when there is no dev server', () => {
    const candidates = buildApiBaseUrlCandidates({ devServerHost: null });
    expect(candidates[0]).toBe(`http://${LAST_KNOWN_LAN_HOST}:${PORT}`);
  });

  it('does not repeat a host that is already in the list', () => {
    const candidates = buildApiBaseUrlCandidates({
      devServerHost: LAST_KNOWN_LAN_HOST,
    });
    expect(candidates.filter(url => url === `http://${LAST_KNOWN_LAN_HOST}:${PORT}`)).toHaveLength(1);
  });

  it('never duplicates a host across the fallback list', () => {
    const candidates = buildApiBaseUrlCandidates({ devServerHost: '192.168.1.42' });
    expect(new Set(candidates).size).toBe(candidates.length);
  });

  // A deliberate pin must not be second-guessed by rotation.
  it('uses only the override when one is set', () => {
    const candidates = buildApiBaseUrlCandidates({
      override: 'https://api.example.com/api/v1',
      devServerHost: '192.168.1.42',
    });
    expect(candidates).toEqual(['https://api.example.com/api/v1']);
  });

  it('ignores a blank override', () => {
    const candidates = buildApiBaseUrlCandidates({ override: '   ', devServerHost: '10.0.0.5' });
    expect(candidates[0]).toBe('http://10.0.0.5:' + PORT);
  });
});
