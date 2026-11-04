# 🔐 JWT Workbench

> A fast, browser-based developer tool for debugging JSON Web Tokens — decode, verify, extend expiry, edit payloads, and re-sign. **Nothing leaves your browser.**

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen)](https://thimmegowdatp.github.io/jwt-workbench/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Vite](https://img.shields.io/badge/built%20with-Vite-646cff)](https://vitejs.dev)

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔍 **Decode** | Instantly decode any JWT into header + payload |
| ✅ **Verify** | Check the signature with your HMAC secret or PEM public key |
| ⏱ **Extend** | Add 1h / 6h / 1d / 7d to the token expiry and re-sign |
| ✏️ **Edit Payload** | Modify any field in the JSON payload and re-sign |
| 📋 **Copy & Download** | Copy decoded JSON or download `payload.json` |
| 🐞 **Debug Reports** | Generate shareable, sanitized JSON reports for bug tickets |
| 🎨 **Dark / Light theme** | Toggle between themes with your preference saved |
| 🔐 **Security Analysis** | Automatically flags expired tokens, missing `aud`/`iss` claims, weak algorithms, long expiries, and sensitive fields |
| 💾 **Save / Load** | Persist tokens to localStorage (secret opt-in only) |
| 🎨 **Color-coded token** | Visual breakdown of header · payload · signature |
| 📊 **Diff view** | See exactly what changed when extending a token |

---

## 🔑 Supported Algorithms

JWT Workbench natively supports both HMAC and public-key cryptography algorithms:
- **HMAC**: `HS256`, `HS384`, `HS512`
- **RSA**: `RS256`, `RS384`, `RS512`
- **ECDSA**: `ES256`, `ES384`

The tool automatically detects the algorithm from the token's header. Just provide your HMAC secret string or a valid PEM public/private key, and it will handle the rest.

---

## 📖 How to Use

1. **Paste your JWT**: Paste your JSON Web Token into the large input area at the top of the page. The token will automatically be color-coded into its Header, Payload, and Signature components.
2. **Decode**: The "Decode" tab instantly visualizes the decoded Header and Payload. You can safely copy the JSON or download it for offline use.
3. **Debug Reports**: Need to attach token info to a Jira/GitHub issue? Click the "🐞 Debug Report" button to download a sanitized JSON report containing the decoded payload, header, signature verification status, and security warnings (with the token's actual signature safely redacted).
4. **Verify Signature**: Switch to the "Verify" tab to check the mathematical signature of the token. Enter your HMAC Secret or PEM Public Key, and the tool will indicate if the token is valid, expired, or has an invalid signature.
5. **Extend Expiry**: Navigate to the "Extend" tab to quickly add time to your token's expiration (`exp` claim). Select an extension duration (1h, 1d, etc.), provide your signing secret, and generate a newly valid token.
6. **Edit Payload**: Use the "Edit" tab to freely modify the JSON payload. Change user roles, update IDs, or add new claims, then provide your secret to instantly generate and re-sign your new token.

---

## 🛠 Tech Stack

- **[Vite](https://vitejs.dev)** — Build tool & dev server
- **[jsrsasign](https://kjur.github.io/jsrsasign/)** — JWT signing & verification (loaded via CDN)
- **[Vitest](https://vitest.dev)** — Unit testing
- Vanilla JS (ES Modules), CSS Custom Properties

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm 9+

### Install & Run

```bash
# Clone the repo
git clone https://github.com/thimmegowdatp/jwt-workbench.git
cd jwt-workbench

# Install dependencies
npm install

# Start dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📁 Project Structure

```
jwt-workbench/
├── public/
│   └── favicon.svg
├── src/
│   ├── main.js           # App entry, event wiring, state
│   ├── styles.css        # Design system (dark/light themes)
│   ├── core/
│   │   ├── decode.js     # JWT base64 decoding
│   │   ├── verify.js     # Signature verification (KJUR)
│   │   ├── extend.js     # Expiry extension + re-signing
│   │   └── resign.js     # Payload edit + re-signing
│   ├── ui/
│   │   ├── renderer.js   # All DOM updates
│   │   ├── tabs.js       # Tab state management
│   │   └── toast.js      # Notification system
│   ├── utils/
│   │   ├── time.js       # humanDuration, formatTimestamp
│   │   └── storage.js    # localStorage helpers
│   └── __tests__/
│       ├── decode.test.js
│       ├── verify.test.js
│       └── extend.test.js
├── index.html
├── vite.config.js
├── package.json
└── README.md
```

---

## 🧪 Testing

```bash
npm run test
```

Unit tests cover:
- JWT decoding (valid token, malformed, missing parts)
- Signature verification (correct/wrong secret, missing inputs, errors)
- Expiry extension math (future expiry, expired token, no expiry)

---

## 📦 Build & Deploy

### Build for production
```bash
npm run build
npm run preview   # preview the built output locally
```

### Deploy to Vercel
```bash
npm install -g vercel
vercel
```

### Deploy to GitHub Pages
```bash
npm run build
# push the dist/ folder or use gh-pages action
```

Add `base: '/jwt-workbench/'` to `vite.config.js` if deploying to a subpath.

---

## 🔒 Security Notes

- **Nothing is sent to a server.** All processing is client-side.
- Secrets are **not persisted by default** — you must explicitly opt-in via the checkbox.
- **Deep Security Analysis**: The tool automatically scans decoded tokens to warn you about:
  - Weak or insecure algorithms (e.g., `none`)
  - Expired tokens or dangerously long expiries (> 1 year)
  - Missing standard claims like `aud` (audience) and `iss` (issuer)
  - Potentially sensitive fields (e.g., email, password, ssn, credit card)
- Do not use this tool with production secrets on shared machines.

---

## 🤝 Contributing

1. Fork the repo
2. Create your feature branch: `git checkout -b feat/my-feature`
3. Commit your changes: `git commit -m 'feat: add my feature'`
4. Push to the branch: `git push origin feat/my-feature`
5. Open a Pull Request

---

## 📄 License

MIT © [thimmegowdatp](https://github.com/thimmegowdatp)
