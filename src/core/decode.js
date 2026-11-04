/**
 * core/decode.js
 * Decodes a JWT token into its header and payload objects.
 * Relies on jsrsasign's KJUR global loaded via CDN.
 */

/**
 * @param {string} token - Raw JWT string
 * @returns {{ header: object, payload: object }}
 * @throws {Error} if token is malformed
 */
export function decodeJWT(token) {
  if (!token || typeof token !== 'string') {
    throw new Error('Token must be a non-empty string.');
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error(`Invalid JWT structure: expected 3 parts, got ${parts.length}.`);
  }

  try {
    const header = JSON.parse(atob(parts[0].replace(/-/g, '+').replace(/_/g, '/')));
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    return { header, payload };
  } catch (e) {
    throw new Error('Failed to decode token parts: ' + e.message);
  }
}
