# Changelog

## Unreleased

- Document protocol/company split and compatibility classes A/B/C. No wire change to receipt/1.0.0.
- Trust pass: Fiscal402 is a trade name of a Netherlands B.V. Legal identity is documented at https://www.fiscal402.com/legal. Statutory KvK/VAT numbers are not invented. Public-contract checker now requires 10 bps standard, 0 bps beta, MCP implemented, and fails until legal identity is registered.
- Public contract checker: `npm run check:public` (local docs) and `npm run check:public:live` (production surfaces). Daily GitHub Actions live check.
- `fiscal402.receipt/2.0.0` experimental specification, JSON Schema, verifier, and UK technical test vectors.
- v2 reuses `fiscal402.sorted-json/1`. v1 golden digest is unchanged.
- `@fiscal402/verify` dispatches on `spec_version` (`parseReceipt` / `verifyReceipt`). `verifyFiscal402Receipt` remains v1-only.
- Docs: verifier is source-only; `@fiscal402/verify` is not published to npm yet.

## 1.0.0 — 2026-09-11

Initial public protocol surface.

- `fiscal402.receipt/1.0.0` specification
- `fiscal402.sorted-json/1` canonicalization
- Ed25519 + JWKS verification semantics
- UBL UTF-8 SHA-256 artifact binding (no XML C14N)
- `@fiscal402/verify` independent verifier and `fiscal402-verify` CLI
- JSON Schema and sanitized test vectors
- Canonical golden digest `b3217e8291e45ff4fabeb00f59ab8ec26bc3861555d48a7cb91a92db1251df4a`
