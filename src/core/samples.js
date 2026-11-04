/**
 * core/samples.js
 * Controlled sample tokens for demos and evaluation.
 * Each sample is weak in exactly one way (plus one well-configured token).
 * Time-based claims are built from "now", so samples never go stale.
 */

// Strong demo secret. Public on purpose: these are demo tokens, not real credentials.
const STRONG_SECRET = 'Zq8#vL2$nX9!tR4@mW7^pK1&yH5*cB3d';

// A public key (no private part). Used for the algorithm-confusion sample.
// Newlines are removed because the key box in the app is a single-line field.
const DEMO_PUBLIC_PEM = `-----BEGIN PUBLIC KEY-----
MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEYHzPUL+miJeBKq4I6Mp/NByLT+Ya
ZoLJHN1BhZZ/UKTilzP/hWFNGdox0CvTdMcUfYMvVFMT4qDM4NFScdgodw==
-----END PUBLIC KEY-----`.replace(/\r?\n/g, '');

const HS = { alg: 'HS256', typ: 'JWT' };
const ID = { iss: 'https://auth.example.com', aud: 'tokenguard-demo', jti: '3f6c1a9e-7b0d-4e21-9c55-0a1d2b3c4d5e' };

export const SAMPLES = [
  {
    id: 'good',
    name: 'Well-configured token (no weaknesses)',
    weakness: 'None (control sample)',
    secret: STRONG_SECRET,
    clean: true,
    expect: [],
    header: HS,
    payload: (now) => ({ sub: 'user_42', ...ID, iat: now, exp: now + 900 }),
  },
  {
    id: 'alg-none',
    name: 'Unsigned token (alg: none)',
    weakness: 'No signature',
    secret: '',
    expect: ['ALG_NONE'],
    header: { alg: 'none', typ: 'JWT' },
    payload: (now) => ({ sub: 'user_42', ...ID, iat: now, exp: now + 900 }),
  },
  {
    id: 'weak-secret',
    name: 'Weak HMAC secret ("secret")',
    weakness: 'Guessable signing secret',
    secret: 'secret',
    expect: ['WEAK_SECRET'],
    header: HS,
    payload: (now) => ({ sub: 'user_42', ...ID, iat: now, exp: now + 900 }),
  },
  {
    id: 'alg-confusion',
    name: 'Algorithm confusion (HS256 signed with a public key)',
    weakness: 'Public key used as HMAC secret',
    secret: DEMO_PUBLIC_PEM,
    expect: ['ALG_CONFUSION'],
    header: HS,
    payload: (now) => ({ sub: 'admin', ...ID, iat: now, exp: now + 900 }),
  },
  {
    id: 'header-injection',
    name: 'Key-injection headers (jku and kid)',
    weakness: 'Attacker-controllable key source',
    secret: STRONG_SECRET,
    expect: ['HEADER_JKU', 'HEADER_KID'],
    header: { alg: 'HS256', typ: 'JWT', kid: '../../dev/null', jku: 'https://evil.example/keys.json' },
    payload: (now) => ({ sub: 'user_42', ...ID, iat: now, exp: now + 900 }),
  },
  {
    id: 'expired',
    name: 'Expired token',
    weakness: 'Token past its expiry',
    secret: STRONG_SECRET,
    expect: ['EXPIRED'],
    header: HS,
    payload: (now) => ({ sub: 'user_42', ...ID, iat: now - 7200, exp: now - 3600 }),
  },
  {
    id: 'no-expiry',
    name: 'Token that never expires',
    weakness: 'Missing exp claim',
    secret: STRONG_SECRET,
    expect: ['NO_EXP'],
    header: HS,
    payload: (now) => ({ sub: 'user_42', ...ID, iat: now }),
  },
  {
    id: 'long-lived',
    name: 'Two-year lifetime',
    weakness: 'Excessive lifetime',
    secret: STRONG_SECRET,
    expect: ['LONG_LIFETIME'],
    header: HS,
    payload: (now) => ({ sub: 'user_42', ...ID, iat: now, exp: now + 2 * 365 * 86400 }),
  },
  {
    id: 'bad-times',
    name: 'Inconsistent time claims',
    weakness: 'nbf and iat in the future, exp before iat',
    secret: STRONG_SECRET,
    expect: ['NBF_FUTURE', 'IAT_FUTURE', 'EXP_BEFORE_IAT'],
    header: HS,
    payload: (now) => ({ sub: 'user_42', ...ID, nbf: now + 3600, iat: now + 7200, exp: now + 3600 }),
  },
  {
    id: 'no-iss-aud',
    name: 'Missing issuer and audience',
    weakness: 'No iss or aud claims',
    secret: STRONG_SECRET,
    expect: ['MISSING_ISS', 'MISSING_AUD'],
    header: HS,
    payload: (now) => ({ sub: 'user_42', jti: ID.jti, iat: now, exp: now + 900 }),
  },
  {
    id: 'sensitive',
    name: 'Sensitive data in payload',
    weakness: 'Personal data readable by anyone',
    secret: STRONG_SECRET,
    expect: ['SENSITIVE_DATA'],
    header: HS,
    payload: (now) => ({ sub: 'user_42', ...ID, email: 'alice@example.com', phone: '+92 300 1234567', password: 'hunter2', iat: now, exp: now + 900 }),
  },
];

function b64url(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  bytes.forEach((b) => { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Builds the token string for a sample.
 * @param {object} sample
 * @param {(alg:string, headerJson:string, payloadJson:string, secret:string) => string} sign
 * @param {number} [now] unix seconds
 */
export function buildSampleToken(sample, sign, now = Math.floor(Date.now() / 1000)) {
  const payload = sample.payload(now);
  if (sample.header.alg === 'none') {
    return `${b64url(JSON.stringify(sample.header))}.${b64url(JSON.stringify(payload))}.`;
  }
  return sign(sample.header.alg, JSON.stringify(sample.header), JSON.stringify(payload), sample.secret);
}