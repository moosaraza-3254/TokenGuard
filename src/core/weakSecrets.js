/**
 * core/weakSecrets.js
 * Offline check against a small list of commonly used HMAC secrets.
 * Nothing is sent anywhere; the list is part of the app.
 */

export const COMMON_SECRETS = [
  'secret', 'secretkey', 'secret-key', 'secret_key', 'supersecret', 'super-secret',
  'super-secret-key', 'supersecretkey', 'your-256-bit-secret', 'your-secret',
  'your-secret-key', 'yoursecret', 'mysecret', 'my-secret', 'my_secret', 'mysecretkey',
  'jwtsecret', 'jwt-secret', 'jwt_secret', 'jwtsecretkey', 'jwt', 'token', 'key',
  'password', 'password1', 'passw0rd', '123456', '12345678', '123456789', '1234567890',
  'qwerty', 'admin', 'administrator', 'root', 'test', 'testing', 'changeme', 'default',
  'letmein', 'welcome', 'hs256-secret', 'hmac', 'hmackey', 'shhhhh', 'keyboard cat',
  'development', 'dev', 'production', 'private', 'pass', 'abc123', 'a',
];

/**
 * @param {string} token
 * @param {string} alg
 * @param {(token:string, secret:string, alg:string) => boolean} verifyFn
 * @returns {string|null} the weak secret that signs the token, or null
 */
export function findWeakSecret(token, alg, verifyFn) {
  if (!alg || !alg.toUpperCase().startsWith('HS')) return null;
  for (const s of COMMON_SECRETS) {
    try {
      if (verifyFn(token, s, alg)) return s;
    } catch { /* ignore and try the next one */ }
  }
  return null;
}