/**
 * core/report.js
 * Builds the TokenGuard PDF report with jsPDF. No network, no secrets.
 */
import { jsPDF } from 'jspdf';

const SEV_RGB = {
  critical: [239, 68, 68],
  high: [249, 115, 22],
  medium: [217, 154, 6],
  low: [59, 130, 246],
  info: [139, 149, 167],
};
const SEVERITIES = ['critical', 'high', 'medium', 'low', 'info'];
const SENSITIVE_KEYS = ['password', 'passwd', 'pwd', 'secret', 'ssn', 'credit', 'cvv', 'card',
  'phone', 'email', 'address', 'dob', 'birth'];

/** jsPDF's built-in fonts only support Latin-1, so replace anything else. */
function clean(value) {
  return String(value).replace(/[^\x20-\x7E\u00A0-\u00FF\n]/g, '?');
}

/** Copy of the payload with values of sensitive-looking fields hidden. */
export function redactPayload(payload) {
  const out = {};
  for (const [k, v] of Object.entries(payload || {})) {
    const lower = k.toLowerCase();
    out[k] = SENSITIVE_KEYS.some((s) => lower.includes(s)) ? '[hidden]' : v;
  }
  return out;
}

/**
 * @param {object} input
 * @param {{findings:object[], score:number, level:string, counts:object}} input.analysis
 * @param {object} input.header
 * @param {object} input.payload
 * @param {boolean|null} input.signatureValid - true, false, or null if not checked
 * @param {Date} [input.date]
 * @returns {jsPDF}
 */
export function buildReport({ analysis, header, payload, signatureValid, date = new Date() }) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 48;
  const CW = W - M * 2;
  let y = M;

  const ensure = (needed) => {
    if (y + needed > H - 50) { doc.addPage(); y = M; }
  };
  const text = (str, { size = 10, bold = false, color = [30, 30, 46], indent = 0, gap = 4 } = {}) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(size);
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(clean(str), CW - indent);
    const lh = size * 1.35;
    for (const line of lines) {
      ensure(lh);
      doc.text(line, M + indent, y + size);
      y += lh;
    }
    y += gap;
  };
  const heading = (str) => {
    ensure(40);
    y += 8;
    text(str, { size: 13, bold: true, color: [30, 30, 46], gap: 2 });
    doc.setDrawColor(200, 204, 221);
    doc.line(M, y, W - M, y);
    y += 8;
  };

  // ── Title ──
  doc.setFillColor(30, 30, 46);
  doc.rect(0, 0, W, 80, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(22);
  doc.text('TokenGuard', M, 42);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(11);
  doc.text('JWT Security Assessment Report', M, 62);
  y = 100;
  text(`Generated: ${date.toISOString().replace('T', ' ').slice(0, 19)} UTC`, { size: 9, color: [100, 100, 130] });

  // ── Summary ──
  heading('Summary');
  const { score, level, counts, findings } = analysis;
  const levelRgb = SEV_RGB[level.toLowerCase()];
  text(`Risk score: ${score} / 100 (${level})`, { size: 14, bold: true, color: levelRgb, gap: 6 });

  ensure(24);
  doc.setFillColor(238, 240, 248);
  doc.roundedRect(M, y, CW, 12, 6, 6, 'F');
  if (score > 0) {
    doc.setFillColor(...levelRgb);
    doc.roundedRect(M, y, Math.max(12, (CW * score) / 100), 12, 6, 6, 'F');
  }
  y += 26;

  text(
    SEVERITIES.map((s) => `${counts[s]} ${s}`).join('   |   '),
    { size: 10, gap: 6 },
  );
  text(`Algorithm: ${clean(header && header.alg ? header.alg : 'none declared')}`, { size: 10, gap: 2 });
  text(`Signature: ${signatureValid === null ? 'not verified (no key supplied)' : signatureValid ? 'verified' : 'INVALID'}`, { size: 10 });

  // ── Findings ──
  heading(`Findings (${findings.length})`);
  if (findings.length === 0) {
    text('No findings. The token passed every check.', { color: [52, 160, 110] });
  }
  findings.forEach((f, i) => {
    ensure(70);
    const rgb = SEV_RGB[f.severity];
    doc.setFillColor(...rgb);
    doc.roundedRect(M, y, 58, 15, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
    doc.text(f.severity.toUpperCase(), M + 29, y + 10.5, { align: 'center' });
    doc.setFontSize(11); doc.setTextColor(30, 30, 46);
    const titleLines = doc.splitTextToSize(clean(`${i + 1}. ${f.title}`), CW - 70);
    doc.text(titleLines, M + 68, y + 11);
    y += Math.max(18, titleLines.length * 14 + 4);
    text(f.description, { size: 9.5, indent: 10, gap: 3 });
    text(`Recommendation: ${f.recommendation}`, { size: 9.5, indent: 10, gap: 3 });
    text(`Reference: ${f.reference}`, { size: 8.5, color: [110, 110, 140], indent: 10, gap: 10 });
  });

  // ── Token details (redacted) ──
  heading('Token details (redacted)');
  text('Signature: [REDACTED]. Values of sensitive-looking fields are hidden. No key or secret is included in this report.',
    { size: 9, color: [110, 110, 140], gap: 6 });
  text('Header', { size: 10, bold: true, gap: 2 });
  text(JSON.stringify(header || {}, null, 2), { size: 8.5, indent: 10, gap: 6 });
  text('Payload', { size: 10, bold: true, gap: 2 });
  text(JSON.stringify(redactPayload(payload), null, 2), { size: 8.5, indent: 10, gap: 6 });

  // ── Method & limitations ──
  heading('Method and limitations');
  text('Scoring: each finding adds points by severity (Critical 40, High 25, Medium 10, Low 3, Info 0), capped at 100. ' +
    'Any Critical finding raises the score to at least 80. Levels: 0-19 Low, 20-49 Medium, 50-79 High, 80-100 Critical.', { size: 9 });
  text('This is a static assessment of the token as supplied. TokenGuard does not attack or send requests to any server and cannot ' +
    'tell how a particular server validates tokens. The weak-secret check tries only a short built-in list of common secrets, so a ' +
    'pass does not prove a secret is strong. Results reflect the moment of analysis; expiry-based findings change over time.', { size: 9 });

  // ── Page numbers ──
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(140, 140, 160);
    doc.text(`TokenGuard report  -  page ${p} of ${pages}`, W / 2, H - 24, { align: 'center' });
  }
  return doc;
}

export function reportFilename(date = new Date()) {
  return `tokenguard-report-${date.toISOString().slice(0, 10)}.pdf`;
}