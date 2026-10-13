/**
 * The single API address the app talks to.
 *
 * Production only, by design. There is deliberately no localhost, LAN, emulator
 * (10.0.2.2) or Metro-derived candidate, and no environment override: a device
 * can never reach a development machine, and a network failure is reported to
 * the screen instead of being retried against another host.
 *
 * The address is https, so no request ever leaves the device unencrypted.
 */
export const API_BASE_URL = 'https://easybrands-backend.vercel.app/api/v1';
