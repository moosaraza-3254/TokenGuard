/**
 * utils/storage.js
 * localStorage helpers for saving/loading JWT tokens.
 * Secrets are NOT saved by default — user opts-in.
 */

const KEY_TOKEN  = 'jwtw_token';
const KEY_SECRET = 'jwtw_secret';

/**
 * @param {{ token: string, secret: string, saveSecret: boolean }} opts
 */
export function saveToStorage({ token, secret, saveSecret }) {
  if (token) localStorage.setItem(KEY_TOKEN, token);
  if (saveSecret && secret) {
    localStorage.setItem(KEY_SECRET, secret);
  } else {
    localStorage.removeItem(KEY_SECRET);
  }
}

/**
 * @returns {{ token: string | null, secret: string | null }}
 */
export function loadFromStorage() {
  return {
    token:  localStorage.getItem(KEY_TOKEN),
    secret: localStorage.getItem(KEY_SECRET),
  };
}

/** Clears all stored data. */
export function clearStorage() {
  localStorage.removeItem(KEY_TOKEN);
  localStorage.removeItem(KEY_SECRET);
}
