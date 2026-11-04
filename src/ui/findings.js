/**
 * ui/findings.js
 * Temporary display of analysis results (replaced by the dashboard in Phase 7).
 */
import { escapeHtml } from './renderer.js';

const COLORS = {
  critical: '#f87171',
  high:     '#fb923c',
  medium:   '#fbbf24',
  low:      '#60a5fa',
  info:     '#94a3b8',
};

export function renderFindings(result) {
  const banner = document.getElementById('securityWarning');
  const { findings, score, level, counts } = result;

  const summary = Object.entries(counts)
    .filter(([, n]) => n > 0)
    .map(([sev, n]) => `<span style="color:${COLORS[sev]}">${n} ${sev}</span>`)
    .join(' · ');

  let html = `<strong>Risk score: ${score}/100 — ${escapeHtml(level)}</strong>`;
  html += `<div style="margin:6px 0 10px;">${summary || 'No findings'}</div>`;

  for (const x of findings) {
    html += `
      <details style="margin-bottom:6px; border-left:3px solid ${COLORS[x.severity]}; padding-left:10px;">
        <summary style="cursor:pointer;">
          <span style="color:${COLORS[x.severity]}; text-transform:uppercase; font-size:0.75rem;">${escapeHtml(x.severity)}</span>
          &nbsp;${escapeHtml(x.title)}
        </summary>
        <p style="margin:6px 0;">${escapeHtml(x.description)}</p>
        <p style="margin:6px 0;"><strong>Fix:</strong> ${escapeHtml(x.recommendation)}</p>
        <p style="margin:6px 0; opacity:0.7;"><em>${escapeHtml(x.reference)}</em></p>
      </details>`;
  }

  banner.style.display = 'block';
  banner.innerHTML = html;
}