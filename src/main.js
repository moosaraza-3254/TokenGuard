/**
 * main.js — Application entry point (TokenGuard)
 */
import './styles.css';

import { decodeJWT } from './core/decode.js';
import { verifySignature } from './core/verify.js';

import {
  renderDecoded, renderSigResult, renderTokenParts,
  copyText, downloadJSON,
} from './ui/renderer.js';
import { analyzeToken as runAnalysis } from './core/analyzer.js';
import { findWeakSecret } from './core/weakSecrets.js';
import { renderDashboard, hideDashboard } from './ui/dashboard.js';
import { buildReport, reportFilename } from './core/report.js';
import { SAMPLES, buildSampleToken } from './core/samples.js';
import { switchTab } from './ui/tabs.js';
import { toast } from './ui/toast.js';

// ─── Application State ────────────────────────────────────────────────────────

const state = {
  currentToken: null,
  currentHeader: null,
  currentPayload: null,
  signatureValid: null,
  analysis: null,
};

const jwtInput = () => document.getElementById('jwtInput');
const secretInput = () => document.getElementById('secretInput');
const outputCard = () => document.getElementById('outputCard');

// ─── Theme ────────────────────────────────────────────────────────────────────

function safeGet(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}
function safeSet(key, value) {
  try { localStorage.setItem(key, value); } catch { /* ignore */ }
}

function initTheme() {
  const saved = safeGet('tokenguard_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  updateThemeBtn(saved);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  safeSet('tokenguard_theme', next);
  updateThemeBtn(next);
}

function updateThemeBtn(theme) {
  const btn = document.getElementById('themeToggle');
  if (btn) btn.textContent = theme === 'dark' ? '☀ Light' : '🌙 Dark';
}

// ─── Analyze ──────────────────────────────────────────────────────────────────

function analyzeToken() {
  const token = jwtInput().value.trim();
  const secret = secretInput().value.trim();

  if (!token) { toast('⚠ Paste a JWT first', 2500, 'warn'); return; }

  try {
    const { header, payload } = decodeJWT(token);
    state.currentToken = token;
    state.currentHeader = header;
    state.currentPayload = payload;

    renderDecoded(header, payload);
    const verifyResult = secret ? verifySignature(token, secret, header.alg) : null;
    state.signatureValid = verifyResult ? verifyResult.valid : null;
    renderSigResult(verifyResult || {});
    renderTokenParts(token);

    const weakSecret = findWeakSecret(token, header.alg, (t, s, a) => verifySignature(t, s, a).valid);
    state.analysis = runAnalysis({
      header,
      payload,
      signature: verifyResult ? { checked: true, valid: verifyResult.valid } : null,
      weakSecret,
      keyIsPem: secret.includes('-----BEGIN'),
    });
    renderDashboard(state.analysis);

    outputCard().style.display = 'block';
    outputCard().scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    switchTab('decoded');
    toast('✓ Token analyzed');
  } catch (e) {
    toast('✕ ' + e.message, 4000, 'error');
  }
}

// ─── Copy & Download ──────────────────────────────────────────────────────────

function copyPayloadJSON() {
  if (!state.currentPayload) { toast('⚠ Analyze a token first', 2500, 'warn'); return; }
  copyText(JSON.stringify(state.currentPayload, null, 2)).then(() => toast('✓ Payload JSON copied'));
}

function downloadPayloadJSON() {
  if (!state.currentPayload) { toast('⚠ Analyze a token first', 2500, 'warn'); return; }
  downloadJSON(state.currentPayload, 'jwt-payload.json');
}

function downloadDebugReport() {
  if (!state.currentToken) { toast('⚠ Analyze a token first', 2500, 'warn'); return; }

  const parts = state.currentToken.split('.');
  const safeToken = parts.length === 3 ? `${parts[0]}.${parts[1]}.[REDACTED]` : '[REDACTED]';

  downloadJSON({
    generatedAt: new Date().toISOString(),
    tool: 'TokenGuard Debug Report',
    token: { safeString: safeToken },
    header: state.currentHeader,
    payload: state.currentPayload,
    securityAnalysis: state.analysis,
    signatureVerified: state.signatureValid,
  }, 'tokenguard-report.json');
}
function downloadPdfReport() {
  if (!state.analysis) { toast('⚠ Analyze a token first', 2500, 'warn'); return; }
  const doc = buildReport({
    analysis: state.analysis,
    header: state.currentHeader,
    payload: state.currentPayload,
    signatureValid: state.signatureValid,
  });
  doc.save(reportFilename());
  toast('✓ PDF report downloaded');
}
function loadSample(id) {
  const sample = SAMPLES.find((s) => s.id === id);
  if (!sample) return;
  const signer = (alg, headerJson, payloadJson, secret) =>
    KJUR.jws.JWS.sign(alg, headerJson, payloadJson, { utf8: secret });
  jwtInput().value = buildSampleToken(sample, signer);
  secretInput().value = sample.secret || '';
  analyzeToken();
}
function clearAll() {
  jwtInput().value = '';
  secretInput().value = '';
  outputCard().style.display = 'none';
  state.currentToken = null;
  state.currentHeader = null;
  state.currentPayload = null;
  state.signatureValid = null;
  state.analysis = null;
  hideDashboard();
}

function toggleSecret() {
  const inp = secretInput();
  inp.type = inp.type === 'password' ? 'text' : 'password';
}

// ─── Event wiring ─────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  const sampleSelect = document.getElementById('sampleSelect');
  if (sampleSelect) {
    SAMPLES.forEach((s) => sampleSelect.add(new Option(s.name, s.id)));
    sampleSelect.addEventListener('change', () => {
      if (sampleSelect.value) loadSample(sampleSelect.value);
    });
  }


  // Demo token so the page isn't empty on first load
  if (!jwtInput().value) {
    jwtInput().value =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyXzEyMyIsIm5hbWUiOiJBbGljZSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc4MDYzNzc3OSwiZXhwIjoxNzgwNjQxMzc5fQ.kk33vUxgJvtyueLeHBoK-EUreKnnxkQ_qr6-BE4JZ0E';
    secretInput().value = 'super-secret-key';
    setTimeout(analyzeToken, 100);
  }

  document.getElementById('themeToggle')?.addEventListener('click', toggleTheme);
  document.getElementById('decodeBtn')?.addEventListener('click', analyzeToken);
  document.getElementById('clearBtn')?.addEventListener('click', clearAll);
  document.getElementById('downloadPdfBtn')?.addEventListener('click', downloadPdfReport);
  document.getElementById('toggleSecretBtn')?.addEventListener('click', toggleSecret);

  document.querySelectorAll('.tab').forEach((btn) => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  document.getElementById('copyPayloadBtn')?.addEventListener('click', copyPayloadJSON);
  document.getElementById('downloadPayloadBtn')?.addEventListener('click', downloadPayloadJSON);
  document.getElementById('downloadDebugReportBtn')?.addEventListener('click', downloadDebugReport);

  // Help modal
  const helpBtn = document.getElementById('helpBtn');
  const helpModal = document.getElementById('helpModal');
  const closeHelpBtn = document.getElementById('closeHelpBtn');
  if (helpBtn && helpModal && closeHelpBtn) {
    helpBtn.addEventListener('click', () => helpModal.showModal());
    closeHelpBtn.addEventListener('click', () => helpModal.close());
    helpModal.addEventListener('click', (e) => {
      const r = helpModal.getBoundingClientRect();
      const inside = e.clientX >= r.left && e.clientX <= r.right &&
        e.clientY >= r.top && e.clientY <= r.bottom;
      if (!inside) helpModal.close();
    });
  }

  // Ctrl+Enter to analyze
  jwtInput()?.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') analyzeToken();
  });
});