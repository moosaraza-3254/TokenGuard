/**
 * ui/tabs.js
 * Tab state management.
 */

export function switchTab(name) {
  document.querySelectorAll('.tab').forEach((t) => {
    t.classList.toggle('active', t.dataset.tab === name);
  });
  document.querySelectorAll('.tab-pane').forEach((p) => {
    p.classList.toggle('active', p.id === 'tab-' + name);
  });
}

export function getActiveTab() {
  const active = document.querySelector('.tab.active');
  return active ? active.dataset.tab : null;
}