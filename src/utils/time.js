/**
 * utils/time.js
 * Human-readable time formatting utilities.
 */

/**
 * Converts a duration in seconds to a short human string.
 * e.g. 3725 → "1h 2m"
 * @param {number} seconds
 * @returns {string}
 */
export function humanDuration(seconds) {
  if (seconds < 60)    return `${seconds}s`;
  if (seconds < 3600)  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  return `${Math.floor(seconds / 86400)}d ${Math.floor((seconds % 86400) / 3600)}h`;
}

/**
 * Formats a Unix timestamp (seconds) as a locale date+time string.
 * @param {number} unix
 * @returns {string}
 */
export function formatTimestamp(unix) {
  return new Date(unix * 1000).toLocaleString();
}
