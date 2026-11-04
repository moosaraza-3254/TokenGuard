/**
 * core/extend.js
 * Creates a new JWT with an extended expiry, re-signed with the provided secret.
 */
import { decodeJWT } from './decode.js';

/**
 * @param {string} token   - Original JWT
 * @param {string} secret  - HMAC secret
 * @param {number} seconds - Seconds to add
 * @returns {{ newToken: string, oldPayload: object, newPayload: object }}
 * @throws {Error}
 */
export function extendJWT(token, secret, seconds) {
  if (!secret) throw new Error('Secret is required to extend a token.');
  if (!token)  throw new Error('Token is required.');

  const { header, payload } = decodeJWT(token);

  const now = Math.floor(Date.now() / 1000);
  const baseExp = payload.exp ? Math.max(payload.exp, now) : now;

  const newPayload = { ...payload, exp: baseExp + seconds, iat: now };

  const alg = header.alg || 'HS256';
  const key = alg.startsWith('HS') ? { utf8: secret } : secret;

  const newToken = KJUR.jws.JWS.sign(
    alg,
    JSON.stringify(header),
    JSON.stringify(newPayload),
    key
  );

  return { newToken, oldPayload: payload, newPayload };
}
