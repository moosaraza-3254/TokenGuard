/**
 * scripts/nodeCrypto.mjs
 * HMAC signing and verification with Node's built-in crypto.
 * Used only by the evaluation script and the tests (the app itself uses jsrsasign in the browser).
 */
import { createHmac } from 'node:crypto';

const HASH = { HS256: 'sha256', HS384: 'sha384', HS512: 'sha512' };

export function hmacSign(alg, headerJson, payloadJson, secret) {
  const b64 = (s) => Buffer.from(s, 'utf8').toString('base64url');
  const data = `${b64(headerJson)}.${b64(payloadJson)}`;
  const sig = createHmac(HASH[alg], secret).update(data).digest('base64url');
  return `${data}.${sig}`;
}

export function hmacVerify(token, secret, alg) {
  const hash = HASH[alg];
  if (!hash) return false;
  const [h, p, s] = token.split('.');
  return createHmac(hash, secret).update(`${h}.${p}`).digest('base64url') === s;
}