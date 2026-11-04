/**
 * ui/dashboard.js
 * Risk dashboard: score gauge, severity chart, filterable finding cards.
 */
import './dashboard.css';
import { escapeHtml } from './renderer.js';

const SEVERITIES = ['critical', 'high', 'medium', 'low', 'info'];

function sevColor(sev) {
  return `var(--sev-${sev})`;
}

function levelColor(level) {
  return sevColor(level.toLowerCase());
}

let lastResult = null;
let activeFilter = 'all';

function gaugeHtml(score, level) {
  const color = levelColor(level);
  return `
    <div class="gauge" role="img" aria-label="Risk score ${score} out of 100, level ${escapeHtml(level)}">
      <svg viewBox="0 0 200 120">
        <path class="gauge-track" d="M 20 105 A 80 80 0 0 1 180 105" pathLength="100"/>
        <path class="gauge-fill" d="M 20 105 A 80 80 0 0 1 180 105" pathLength="100"
              style="stroke:${color};${score === 0 ? 'display:none' : ''}" stroke-dasharray="${score} 100"/>
        <text class="gauge-score" x="100" y="90" text-anchor="middle">${score}</text>
        <text class="gauge-of" x="100" y="108" text-anchor="middle">out of 100</text>
      </svg>
      <div class="gauge-level" style="color:${color}">${escapeHtml(level)} risk</div>
    </div>`;
}

function barsHtml(counts) {
  const max = Math.max(1, ...SEVERITIES.map((s) => counts[s]));
  return `<div class="sev-bars">` + SEVERITIES.map((s) => `
      <button class="sev-row" data-filter="${s}" aria-label="Show ${s} findings">
        <span class="sev-name">${s}</span>
        <span class="sev-track"><span class="sev-bar" style="display:block; width:${(counts[s] / max) * 100}%; background:${sevColor(s)}"></span></span>
        <span class="sev-count">${counts[s]}</span>
      </button>`).join('') + `</div>`;
}

function filtersHtml(counts, total) {
  const chip = (key, label, n) =>
    `<button class="dash-chip${activeFilter === key ? ' active' : ''}" data-filter="${key}">${label} (${n})</button>`;
  return `<div class="dash-filters">` +
    chip('all', 'All', total) +
    SEVERITIES.filter((s) => counts[s] > 0).map((s) => chip(s, s[0].toUpperCase() + s.slice(1), counts[s])).join('') +
    `</div>`;
}

function findingHtml(f) {
  return `
    <details class="finding" style="border-left-color:${sevColor(f.severity)}">
      <summary>
        <span class="sev-badge" style="background:${sevColor(f.severity)}">${escapeHtml(f.severity)}</span>
        <span>${escapeHtml(f.title)}</span>
      </summary>
      <div class="finding-body">
        <p>${escapeHtml(f.description)}</p>
        <p><strong>Recommendation:</strong> ${escapeHtml(f.recommendation)}</p>
        <p class="finding-ref">Reference: ${escapeHtml(f.reference)}</p>
      </div>
    </details>`;
}

/**
 * @param {{ findings: object[], score: number, level: string, counts: object }} result
 */
export function renderDashboard(result) {
  const card = document.getElementById('dashboardCard');
  if (!card) return;

  if (result !== lastResult) activeFilter = 'all';
  lastResult = result;

  const { findings, score, level, counts } = result;
  const shown = activeFilter === 'all' ? findings : findings.filter((f) => f.severity === activeFilter);

  card.innerHTML = `
    <div class="card-label">Risk Dashboard</div>
    <div class="dash-top">
      ${gaugeHtml(score, level)}
      ${barsHtml(counts)}
    </div>
    ${filtersHtml(counts, findings.length)}
    <div class="finding-list">
      ${shown.length ? shown.map(findingHtml).join('') : '<div class="dash-empty">✓ No findings in this category.</div>'}
    </div>`;
  card.style.display = 'block';

  card.querySelectorAll('[data-filter]').forEach((el) => {
    el.addEventListener('click', () => {
      activeFilter = el.dataset.filter;
      renderDashboard(lastResult);
    });
  });
}

export function hideDashboard() {
  const card = document.getElementById('dashboardCard');
  if (card) card.style.display = 'none';
  lastResult = null;
  activeFilter = 'all';
}