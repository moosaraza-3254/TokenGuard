# TokenGuard

A browser-based JWT (JSON Web Token) security analyzer. Paste a token and TokenGuard decodes it, checks it against a set of security rules, scores the risk, and can export a PDF report. 

**Repository:** `https://github.com/moosaraza-3254/TokenGuard`
---

## What it does

- Decodes the header, payload and signature of any JWT, entirely in your browser.
- Verifies HMAC signatures (HS256, HS384, HS512) when you provide the secret.
- Runs security rules and lists each finding with a severity (Critical, High, Medium, Low, Info):
  - `ALG_NONE`: unsigned token
  - `WEAK_SECRET`: signing secret found in a list of common secrets
  - `ALG_CONFUSION`: HMAC token signed with a public key
  - `HEADER_JKU`, `HEADER_KID`: attacker-controllable key sources in the header
  - `EXPIRED`, `NO_EXP`, `LONG_LIFETIME`: expiry problems
  - `NBF_FUTURE`, `IAT_FUTURE`, `EXP_BEFORE_IAT`: inconsistent time claims
  - `MISSING_ISS`, `MISSING_AUD`: missing issuer or audience
  - `SENSITIVE_DATA`: personal data readable in the payload
- Computes a risk score from 0 to 100 and a level (Low, Medium, High, Critical).
- Loads 11 built-in sample tokens (10 weak, 1 well-configured) from a dropdown.
- Exports a PDF report. The secret you typed is not written into the PDF.

## Privacy

Everything runs locally in your browser. Tokens and secrets are never sent to a server.

---

## Requirements

- [Node.js](https://nodejs.org) 18 or newer (check with `node -v`)
- npm (comes with Node)
- Git

## Install

```bash
git clone <YOUR-GITHUB-REPO-LINK>
cd <repo-folder-name>
npm install
```

## Run the app

```bash
npm run dev
```

Open the address it prints (usually http://localhost:5173). Stop it with `Ctrl + C`.

**Quick try:** choose "Weak HMAC secret" from the *Load a sample token* dropdown. The dashboard should show a Critical `WEAK_SECRET` finding and a score of 80.

## Run the tests

```bash
npm test
```

All tests should pass (93 tests across 6 files at the end of Phase 9).

## Run the evaluation

```bash
npm run evaluate
```

This builds the 11 sample tokens, runs each through the same pipeline the app uses, prints a results table, and writes it to `docs/evaluation.md`. Expected result:

- Detection rate: 10 of 10 weak samples had every expected finding reported
- False positives on the control token: 0
- Overall: 11 of 11 samples passed

## Build for production

```bash
npm run build
```

The static site is created in the `dist/` folder. Preview it locally with `npm run preview`.

## Deploy

Because the app is fully static, any static host works. Two easy options:

**Netlify (drag and drop)**
1. Run `npm run build`.
2. Go to https://app.netlify.com/drop and drop the `dist/` folder.

**GitHub Pages / Vercel**
Connect the GitHub repo, set the build command to `npm run build` and the output folder to `dist`.

> If you deploy to a sub-path (such as GitHub Pages `/repo-name/`), set `base: '/repo-name/'` in `vite.config.js`.

---

## Project structure

```
index.html              Page layout and the sample dropdown
vite.config.js          Build configuration
package.json            Scripts and dependencies
LICENSE
.github/                GitHub configuration
public/                 Static assets
src/
  main.js               Entry point: wires the UI to the core modules
  styles.css            Global styles
  core/                 Pure logic, no DOM
    decode.js           Splits and decodes the JWT
    verify.js           Signature verification
    analyzer.js         Rule engine and risk scoring
    weakSecrets.js      Common-secret check
    report.js           PDF report builder
    samples.js          The 11 controlled sample tokens
    evaluate.js         Runs a sample through the pipeline
  ui/                   Browser interface
    dashboard.js/.css   Security dashboard
    renderer.js         Renders decoded token and findings
    tabs.js             Tab switching
    toast.js            Notifications
  utils/
    time.js             Time helpers
  __tests__/            Vitest unit tests (analyzer, decode, report,
                        samples, verify, weakSecrets)
scripts/
  nodeCrypto.mjs        HMAC helpers using Node's crypto (tests and evaluation only)
  evaluate.mjs          Produces docs/evaluation.md
docs/
  ARCHITECTURE.md       How the parts fit together, and proposal coverage
  SECURITY_ANALYSIS.md  Findings, evaluation, limitations
  evaluation.md         Generated results table
```

## Scoring

Each finding adds points by severity: Critical 40, High 25, Medium 10, Low 3, Info 0. The total is capped at 100. Any Critical finding raises the score to at least 80.

| Score | Level |
|---|---|
| 0-19 | Low |
| 20-49 | Medium |
| 50-79 | High |
| 80-100 | Critical |

## Limitations

- TokenGuard assesses JWT security only. It is not a web application penetration-testing tool, does not attack external systems, and does not certify an application as secure.
- Assessments are limited to supported JWT formats, the verification information you provide, and the predefined analysis rules.
- The samples and the rules were written by the same team, so a 10/10 detection rate shows the rules work as designed, not that they catch every real-world weakness.
- Only HMAC signature verification is supported; RS256/ES256 signatures are not verified.
- The weak-secret check only tests a fixed list of common secrets.

See `docs/SECURITY_ANALYSIS.md` for the full discussion.

