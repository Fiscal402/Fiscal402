# Changelog

## Unreleased

- Prepare public developer packages: `@fiscal402/sdk`, `@fiscal402/node`, `@fiscal402/cli`.
  Not published to npm until the `fiscal402` npm organization exists and a verified publish completes.
- `@fiscal402/sdk` typed HTTP client for production routes (`/settlements`, `/v1/fiscal-events`, `/v1/receipts`, `/v1/capabilities`, JWKS).
- `@fiscal402/node` server-side convenience client (`Fiscal402.processSettlement`).
- `@fiscal402/cli` binary `fiscal402` for capabilities, receipt verify, and authenticated reads.
- Merchant credentials use `FISCAL402_MERCHANT_KEY` / `f402m_...` / `X-Fiscal402-Key` only.
- Public contract checker: `npm run check:public` (local docs) and `npm run check:public:live` (production surfaces). Daily GitHub Actions live check.
- `fiscal402.receipt/2.0.0` experimental specification, JSON Schema, verifier, and UK technical test vectors.
- v2 reuses `fiscal402.sorted-json/1`. v1 golden digest is unchanged.
- `@fiscal402/verify` dispatches on `spec_version` (`parseReceipt` / `verifyReceipt`). `verifyFiscal402Receipt` remains v1-only.
- Docs: packages are source-only until npm publication is confirmed with `npm view`.

## 1.0.0 — 2026-09-11

Initial public protocol surface.

- `fiscal402.receipt/1.0.0` specification
- `fiscal402.sorted-json/1` canonicalization
- Ed25519 + JWKS verification semantics
- UBL UTF-8 SHA-256 artifact binding (no XML C14N)
- `@fiscal402/verify` independent verifier and `fiscal402-verify` CLI
- JSON Schema and sanitized test vectors
- Canonical golden digest `b3217e8291e45ff4fabeb00f59ab8ec26bc3861555d48a7cb91a92db1251df4a`
