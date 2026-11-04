/**
 * core/resign.js
 * Re-signs a JWT with edited payload using the provided secret.
 */

/**
 * @param {object} header  - JWT header object
 * @param {object} payload - New payload object
 * @param {string} secret  - HMAC secret
 * @returns {string} - New signed JWT
 * @throws {Error}
 */
export function resignJWT(header, payload, secret) {
  if (!secret)  throw new Error('Secret is required to sign a token.');
  if (!header)  throw new Error('Header is required.');
  if (!payload) throw new Error('Payload is required.');

  const alg = header.alg || 'HS256';
  const key = alg.startsWith('HS') ? { utf8: secret } : secret;

  return KJUR.jws.JWS.sign(
    alg,
    JSON.stringify(header),
    JSON.stringify(payload),
    key
  );
}
