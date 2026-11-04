/**
 * core/decode.js
 * Decodes a JWT into its header and payload objects.
 */

function base64UrlToJson(part) {
  let s = part.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  const binary = atob(s);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

/**
 * @param {string} token - Raw JWT string
 * @returns {{ header: object, payload: object }}
 * @throws {Error} if token is malformed
 */
export function decodeJWT(token) {
  if (!token || typeof token !== 'string') {
    throw new Error('Token must be a non-empty string.');
  }

  const parts = token.trim().split('.');
  if (parts.length !== 3) {
    throw new Error(`Invalid JWT structure: expected 3 parts, got ${parts.length}.`);
  }

  try {
    const header = base64UrlToJson(parts[0]);
    const payload = base64UrlToJson(parts[1]);
    return { header, payload };
  } catch (e) {
    throw new Error('Failed to decode token parts: ' + e.message);
  }
}