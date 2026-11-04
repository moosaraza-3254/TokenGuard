/**
 * ui/renderer.js
 * All DOM rendering — keeps business logic out of the view layer.
 */
import { humanDuration, formatTimestamp } from '../utils/time.js';

const TIME_FIELDS = ['exp', 'iat', 'nbf'];

/** Makes untrusted text safe to put inside HTML. */
export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

export function renderStatus(payload) {
  const badge = document.getElementById('statusBadge');
  if (!payload.exp) {
    badge.className = 'badge badge-unverified';
    badge.innerHTML = '<span class="badge-dot"></span> NO EXPIRY';
    return;
  }
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp > now) {
    badge.className = 'badge badge-valid';
    badge.innerHTML = `<span class="badge-dot"></span> VALID — expires in ${humanDuration(payload.exp - now)}`;
  } else {
    badge.className = 'badge badge-expired';
    badge.innerHTML = `<span class="badge-dot"></span> EXPIRED — ${humanDuration(now - payload.exp)} ago`;
  }
}

// ─── Signature Result ─────────────────────────────────────────────────────────

export function renderSigResult(result) {
  const el = document.getElementById('sigVerifyResult');
  if (!result || Object.keys(result).length === 0) {
    el.className = '';
    el.textContent = '';
    return;
  }
  const { valid, error } = result;
  el.className = 'sig-result ' + (valid ? 'sig-ok' : 'sig-fail');
  el.textContent = valid ? '✓ Signature verified' : `✕ ${error || 'Signature invalid'}`;
}

// ─── Decoded Tab ──────────────────────────────────────────────────────────────

export function renderDecoded(header, payload) {
  document.getElementById('headerOutput').textContent = JSON.stringify(header, null, 2);
  document.getElementById('payloadOutput').textContent = JSON.stringify(payload, null, 2);
  renderClaimsTable(payload);
  renderStatus(payload);

}

function renderClaimsTable(payload) {
  const tbody = document.querySelector('#claimsTable tbody');
  tbody.innerHTML = '';
  for (const [k, v] of Object.entries(payload)) {
    const tr = document.createElement('tr');
    const shown = typeof v === 'object' && v !== null ? JSON.stringify(v) : String(v);
    let extra = '';

    if (TIME_FIELDS.includes(k) && typeof v === 'number') {
      extra = `<span class="time-label">${escapeHtml(formatTimestamp(v))}</span>`;
      if (k === 'exp') {
        const diff = v - Math.floor(Date.now() / 1000);
        const label = diff > 0
          ? `expires in ${humanDuration(diff)}`
          : `expired ${humanDuration(-diff)} ago`;
        extra += `<span class="time-label" style="color:${diff > 0 ? 'var(--valid)' : 'var(--danger)'}">${label}</span>`;
      }
    }
    tr.innerHTML = `<td>${escapeHtml(k)}</td><td>${escapeHtml(shown)}${extra}</td>`;
    tbody.appendChild(tr);
  }
}

// Temporary simple checks. Phase 5 replaces this with the full rule engine.
export function getSecurityWarnings(header, payload) {
  const warnings = [];

  if (!header.alg || String(header.alg).toLowerCase() === 'none') {
    warnings.push('Weak algorithm: "none" is insecure.');
  }

  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < now) warnings.push('Expired token.');
  if (payload.exp && (payload.exp - now) > 31536000) warnings.push('Very long expiry (longer than 1 year).');
  if (!payload.aud) warnings.push('Missing aud (audience) claim.');
  if (!payload.iss) warnings.push('Missing iss (issuer) claim.');

  const sensitive = ['email', 'phone', 'ssn', 'password', 'credit', 'card'];
  const keys = Object.keys(payload).map((k) => k.toLowerCase());
  const found = sensitive.filter((s) => keys.some((k) => k.includes(s)));
  if (found.length > 0) warnings.push(`Sensitive fields detected: ${found.join(', ')}.`);

  return warnings;
}

function renderSecurityWarning(header, payload) {
  const banner = document.getElementById('securityWarning');
  const warnings = getSecurityWarnings(header, payload);

  if (warnings.length > 0) {
    banner.style.display = 'block';
    let html = '<strong>⚠ Security Analysis:</strong><ul style="margin: 8px 0 0 20px; padding: 0;">';
    warnings.forEach((w) => { html += `<li style="margin-bottom: 4px;">${escapeHtml(w)}</li>`; });
    html += '</ul>';
    banner.innerHTML = html;
  } else {
    banner.style.display = 'none';
  }
}

// ─── Raw Token Tab ────────────────────────────────────────────────────────────

export function renderTokenParts(token) {
  const parts = token.split('.');
  const container = document.getElementById('tokenParts');
  if (parts.length !== 3) {
    container.textContent = 'Invalid token structure';
    return;
  }
  container.innerHTML =
    `<span class="part-header">${escapeHtml(parts[0])}</span>` +
    `<span class="dot">.</span>` +
    `<span class="part-payload">${escapeHtml(parts[1])}</span>` +
    `<span class="dot">.</span>` +
    `<span class="part-sig">${escapeHtml(parts[2])}</span>`;
}

// ─── Copy & Download Helpers ──────────────────────────────────────────────────

export function copyText(text) {
  return navigator.clipboard.writeText(text);
}

export function downloadJSON(obj, filename = 'payload.json') {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}