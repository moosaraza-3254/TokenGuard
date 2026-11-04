/**
 * ui/toast.js
 * Notification toast system.
 */

let _toastTimer = null;

/**
 * @param {string} msg
 * @param {number} [duration=2500]
 * @param {'success'|'error'|'warn'} [type='success']
 */
export function toast(msg, duration = 2500, type = 'success') {
  const el = document.getElementById('toast');
  if (!el) return;

  el.textContent = msg;
  el.dataset.type = type;
  el.classList.add('show');

  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.remove('show'), duration);
}
