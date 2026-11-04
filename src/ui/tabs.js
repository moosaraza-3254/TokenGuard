/**
 * ui/tabs.js
 * Tab state management.
 */

const TAB_NAMES = ['decoded', 'raw', 'extend', 'edit'];

/**
 * Switches the active tab.
 * @param {string} name - one of TAB_NAMES
 */
export function switchTab(name) {
  document.querySelectorAll('.tab').forEach((t) => {
    t.classList.toggle('active', t.dataset.tab === name);
  });
  document.querySelectorAll('.tab-pane').forEach((p) => {
    p.classList.toggle('active', p.id === 'tab-' + name);
  });
}

/** Returns the name of the currently active tab. */
export function getActiveTab() {
  const active = document.querySelector('.tab.active');
  return active ? active.dataset.tab : null;
}
