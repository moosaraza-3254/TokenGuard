# TokenGuard evaluation results

Generated: 2026-11-04 22:32:34 UTC

| # | Sample token | Deliberate weakness | Expected rule(s) | Detected | Score | Level | Result |
|---|---|---|---|---|---|---|---|
| 1 | Well-configured token (no weaknesses) | None (control sample) | (none) | No findings (correct) | 0 | Low | PASS |
| 2 | Unsigned token (alg: none) | No signature | ALG_NONE | Yes | 80 | Critical | PASS |
| 3 | Weak HMAC secret ("secret") | Guessable signing secret | WEAK_SECRET | Yes | 80 | Critical | PASS |
| 4 | Algorithm confusion (HS256 signed with a public key) | Public key used as HMAC secret | ALG_CONFUSION | Yes | 80 | Critical | PASS |
| 5 | Key-injection headers (jku and kid) | Attacker-controllable key source | HEADER_JKU, HEADER_KID | Yes | 35 | Medium | PASS |
| 6 | Expired token | Token past its expiry | EXPIRED | Yes | 25 | Medium | PASS |
| 7 | Token that never expires | Missing exp claim | NO_EXP | Yes | 25 | Medium | PASS |
| 8 | Two-year lifetime | Excessive lifetime | LONG_LIFETIME | Yes | 10 | Low | PASS |
| 9 | Inconsistent time claims | nbf and iat in the future, exp before iat | NBF_FUTURE, IAT_FUTURE, EXP_BEFORE_IAT | Yes | 30 | Medium | PASS |
| 10 | Missing issuer and audience | No iss or aud claims | MISSING_ISS, MISSING_AUD | Yes | 20 | Medium | PASS |
| 11 | Sensitive data in payload | Personal data readable by anyone | SENSITIVE_DATA | Yes | 25 | Medium | PASS |

- **Detection rate:** 10 of 10 weak samples had every expected finding reported.
- **False positives on the control token:** 0.
- **Overall:** 11 of 11 samples passed.
