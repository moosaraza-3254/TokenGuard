/**
 * main.js — Application entry point
 * Wires all modules together and manages application state.
 */
import './styles.css';

import { decodeJWT }       from './core/decode.js';
import { verifySignature } from './core/verify.js';
import { extendJWT }       from './core/extend.js';
import { resignJWT }       from './core/resign.js';

import { renderDecoded, renderSigResult, renderTokenParts, renderEditTab, renderDiff, copyText, downloadJSON, getSecurityWarnings } from './ui/renderer.js';
import { switchTab }       from './ui/tabs.js';
import { toast }           from './ui/toast.js';

import { saveToStorage, loadFromStorage, clearStorage } from './utils/storage.js';

// ─── Application State ────────────────────────────────────────────────────────

const state = {
  currentToken:   null,
  currentHeader:  null,
  currentPayload: null,
  signatureValid: null,
};

// ─── DOM Refs ─────────────────────────────────────────────────────────────────

const jwtInput     = () => document.getElementById('jwtInput');
const secretInput  = () => document.getElementById('secretInput');
const outputCard   = () => document.getElementById('outputCard');
const saveSecretCb = () => document.getElementById('saveSecretCheckbox');

// ─── Theme ───────────────────────────────────────────────────────────────────

function initTheme() {
  const saved = localStorage.getItem('jwtw_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', saved);
  updateThemeBtn(saved);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('jwtw_theme', next);
  updateThemeBtn(next);
}

function updateThemeBtn(theme) {
  const btn = document.getElementById('themeToggle');
  if (btn) btn.textContent = theme === 'dark' ? '☀ Light' : '🌙 Dark';
}

// ─── Decode & Verify ─────────────────────────────────────────────────────────

function decodeAndVerify() {
  const token  = jwtInput().value.trim();
  const secret = secretInput().value.trim();

  if (!token) { toast('⚠ Paste a JWT first', 2500, 'warn'); return; }

  const decodeBtn = document.getElementById('decodeBtn');
  decodeBtn.classList.add('loading');
  decodeBtn.textContent = '⏳ Decoding…';

  try {
    const { header, payload } = decodeJWT(token);
    state.currentToken   = token;
    state.currentHeader  = header;
    state.currentPayload = payload;

    renderDecoded(header, payload);
    const verifyResult = secret ? verifySignature(token, secret, header.alg) : null;
    state.signatureValid = verifyResult ? verifyResult.valid : null;
    renderSigResult(verifyResult || {});
    renderTokenParts(token);
    renderEditTab(payload);

    outputCard().style.display = 'block';
    outputCard().scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    switchTab('decoded');
    toast('✓ Decoded successfully');
  } catch (e) {
    toast('✕ ' + e.message, 4000, 'error');
  } finally {
    decodeBtn.classList.remove('loading');
    decodeBtn.textContent = '🔍 Decode & Verify';
  }
}

// ─── Extend ──────────────────────────────────────────────────────────────────

function extend(seconds) {
  const secret = secretInput().value.trim();
  if (!secret)               { toast('⚠ Enter the secret first', 2500, 'warn'); return; }
  if (!state.currentPayload) { toast('⚠ Decode a token first',   2500, 'warn'); return; }

  try {
    const { newToken, oldPayload, newPayload } = extendJWT(state.currentToken, secret, seconds);

    document.getElementById('newTokenOutput').textContent = newToken;
    document.getElementById('newAlgBadge').textContent    = state.currentHeader.alg || 'HS256';
    document.getElementById('extendOutput').style.display = 'block';

    renderDiff(
      { exp: oldPayload.exp, iat: oldPayload.iat },
      { exp: newPayload.exp, iat: newPayload.iat }
    );
    switchTab('extend');
    toast('✓ Token extended');
  } catch (e) {
    toast('✕ ' + e.message, 4000, 'error');
  }
}

// ─── Re-sign Edited ──────────────────────────────────────────────────────────

function resignEdited() {
  const secret = secretInput().value.trim();
  if (!secret) { toast('⚠ Enter the secret first', 2500, 'warn'); return; }

  let newPayload;
  try {
    newPayload = JSON.parse(document.getElementById('editPayload').value);
  } catch (e) {
    toast('✕ Invalid JSON: ' + e.message, 4000, 'error');
    return;
  }

  try {
    const newToken = resignJWT(state.currentHeader, newPayload, secret);
    document.getElementById('editedTokenOutput').textContent = newToken;
    document.getElementById('editOutput').style.display = 'block';
    toast('✓ Signed');
  } catch (e) {
    toast('✕ ' + e.message, 4000, 'error');
  }
}

function resetEdit() {
  document.getElementById('editPayload').value   = JSON.stringify(state.currentPayload, null, 2);
  document.getElementById('editOutput').style.display = 'none';
}

// ─── Copy & Download ─────────────────────────────────────────────────────────

function copyNewToken() {
  const t = document.getElementById('newTokenOutput').textContent;
  copyText(t).then(() => toast('✓ Copied!'));
}

function useNewToken() {
  jwtInput().value = document.getElementById('newTokenOutput').textContent;
  toast('✓ Loaded into input');
  decodeAndVerify();
}

function copyEditedToken() {
  const t = document.getElementById('editedTokenOutput').textContent;
  copyText(t).then(() => toast('✓ Copied!'));
}

function useEditedToken() {
  jwtInput().value = document.getElementById('editedTokenOutput').textContent;
  toast('✓ Loaded into input');
  decodeAndVerify();
}

function copyPayloadJSON() {
  if (!state.currentPayload) { toast('⚠ Decode a token first', 2500, 'warn'); return; }
  copyText(JSON.stringify(state.currentPayload, null, 2)).then(() => toast('✓ Payload JSON copied'));
}

function downloadPayloadJSON() {
  if (!state.currentPayload) { toast('⚠ Decode a token first', 2500, 'warn'); return; }
  downloadJSON(state.currentPayload, 'jwt-payload.json');
  toast('✓ Downloading payload.json');
}

// ─── Debug Report ────────────────────────────────────────────────────────────

function downloadDebugReport() {
  if (!state.currentToken) { toast('⚠ Decode a token first', 2500, 'warn'); return; }

  const parts = state.currentToken.split('.');
  const safeToken = parts.length === 3 ? `${parts[0]}.${parts[1]}.[REDACTED]` : state.currentToken;

  const warnings = getSecurityWarnings(state.currentHeader, state.currentPayload);
  
  const report = {
    generatedAt: new Date().toISOString(),
    tool: "JWT Workbench Debug Report",
    token: {
      format: parts.length === 3 ? "JWS" : "Unknown",
      safeString: safeToken
    },
    header: state.currentHeader,
    payload: state.currentPayload,
    securityAnalysis: warnings,
    signatureVerified: state.signatureValid
  };

  downloadJSON(report, 'jwt-debug-report.json');
  toast('✓ Downloading debug report');
}

// ─── Save / Load / Clear ─────────────────────────────────────────────────────

function saveToken() {
  saveToStorage({
    token:      jwtInput().value,
    secret:     secretInput().value,
    saveSecret: saveSecretCb()?.checked ?? false,
  });
  toast('✓ Saved to localStorage');
}

function loadToken() {
  const { token, secret } = loadFromStorage();
  if (!token && !secret) { toast('⚠ Nothing saved', 2500, 'warn'); return; }
  
  if (token) jwtInput().value = token;
  
  if (secret) {
    secretInput().value = secret;
    const cb = saveSecretCb();
    if (cb) cb.checked = true;
  }
  
  toast('✓ Loaded');
}

function initSecret() {
  const { secret } = loadFromStorage();
  if (secret) {
    secretInput().value = secret;
    const cb = saveSecretCb();
    if (cb) cb.checked = true;
  }
}

function clearAll() {
  jwtInput().value = '';
  outputCard().style.display = 'none';
  state.currentToken   = null;
  state.currentHeader  = null;
  state.currentPayload = null;
}

// ─── Secret visibility ────────────────────────────────────────────────────────

function toggleSecret() {
  const inp = secretInput();
  inp.type = inp.type === 'password' ? 'text' : 'password';
}

// ─── Event wiring ─────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initSecret();

  // Load default demo token if no token is present
  if (!jwtInput().value) {
    const defaultToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyXzEyMyIsIm5hbWUiOiJBbGljZSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc4MDYzNzc3OSwiZXhwIjoxNzgwNjQxMzc5fQ.kk33vUxgJvtyueLeHBoK-EUreKnnxkQ_qr6-BE4JZ0E";
    jwtInput().value = defaultToken;
    if (!secretInput().value) {
      secretInput().value = "super-secret-key";
    }
    // Automatically decode the demo token
    setTimeout(() => decodeAndVerify(), 100);
  }

  // Theme
  document.getElementById('themeToggle')?.addEventListener('click', toggleTheme);

  // Main actions
  document.getElementById('decodeBtn')?.addEventListener('click', decodeAndVerify);
  document.getElementById('saveBtn')?.addEventListener('click', saveToken);
  document.getElementById('loadBtn')?.addEventListener('click', loadToken);
  document.getElementById('clearBtn')?.addEventListener('click', clearAll);

  // Secret
  document.getElementById('toggleSecretBtn')?.addEventListener('click', toggleSecret);

  // Tabs
  document.querySelectorAll('.tab').forEach((btn) => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // Extend
  document.getElementById('extend1h')?.addEventListener('click',  () => extend(3600));
  document.getElementById('extend6h')?.addEventListener('click',  () => extend(21600));
  document.getElementById('extend1d')?.addEventListener('click',  () => extend(86400));
  document.getElementById('extend7d')?.addEventListener('click',  () => extend(604800));

  // Copy / use new token
  document.getElementById('copyNewTokenBtn')?.addEventListener('click', copyNewToken);
  document.getElementById('useNewTokenBtn')?.addEventListener('click', useNewToken);

  // Copy / download payload
  document.getElementById('copyPayloadBtn')?.addEventListener('click', copyPayloadJSON);
  document.getElementById('downloadPayloadBtn')?.addEventListener('click', downloadPayloadJSON);
  document.getElementById('downloadDebugReportBtn')?.addEventListener('click', downloadDebugReport);

  // Edit tab
  document.getElementById('resignBtn')?.addEventListener('click', resignEdited);
  document.getElementById('resetEditBtn')?.addEventListener('click', resetEdit);
  document.getElementById('copyEditedBtn')?.addEventListener('click', copyEditedToken);
  document.getElementById('useEditedBtn')?.addEventListener('click', useEditedToken);

  // Help Modal
  const helpBtn = document.getElementById('helpBtn');
  const helpModal = document.getElementById('helpModal');
  const closeHelpBtn = document.getElementById('closeHelpBtn');

  if (helpBtn && helpModal && closeHelpBtn) {
    helpBtn.addEventListener('click', () => helpModal.showModal());
    closeHelpBtn.addEventListener('click', () => helpModal.close());
    // Close on backdrop click
    helpModal.addEventListener('click', (e) => {
      const rect = helpModal.getBoundingClientRect();
      const inDialog = e.clientX >= rect.left && e.clientX <= rect.right &&
                       e.clientY >= rect.top && e.clientY <= rect.bottom;
      if (!inDialog) helpModal.close();
    });
  }

  // Keyboard shortcut: Ctrl+Enter to decode
  document.getElementById('jwtInput')?.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') decodeAndVerify();
  });
});
