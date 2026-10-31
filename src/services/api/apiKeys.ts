/**
 * Client gate keys, sent as headers on every API request.
 *
 * These must match `APP_KEY` / `APP_SECRET` in `Backend/.env` (and in the
 * deployed backend's environment). If either differs, every call gets
 * `401 Unauthenticated`.
 *
 * They are a client gate, not a server secret: a value shipped inside a mobile
 * app can always be extracted, so treat them as an abuse deterrent only. The
 * real secret (Gemini, Mongo) stays on the server.
 */
export const APP_KEY_HEADER = 'x-app-key';
export const APP_SECRET_HEADER = 'x-app-secret';

export const APP_KEY = '1eb13fdb32052117d8bf8bea833139b7ea7294e43701181d16a3f5374fd84ed5';
export const APP_SECRET = '370acc055fd5f3cd8dd85f6f2e1da368cf5bae7bc89e82319c73ed2262efa8ab';
