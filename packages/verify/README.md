# @fiscal402/verify

Independent verifier for `fiscal402.receipt/1.0.0`.

This package does **not** classify VAT, look up VIES, quote FX, or ingest settlements.
It checks receipt integrity: schema id, canonical payload, Ed25519 signature, JWKS key, and optional artifact hash.

## Install

This repository has not been published to npm yet. Use it from source:

```bash
git clone https://github.com/Fiscal402/Fiscal402.git
cd Fiscal402/packages/verify
npm install
npm run build
```

## API

```ts
import {
  parseReceipt,
  verifyReceipt,
  verifyFiscal402Receipt,
  verifyArtifactHash,
  hashCanonicalPayload,
} from "@fiscal402/verify";

const receipt = parseReceipt(json);
const report = verifyReceipt({
  receipt,
  jwks,
  ubl, // optional UTF-8 artifact bytes
});

if (report.verified) {
  // cryptographic integrity only — not tax-authority acceptance
}
```

`verified` means the signed payload recomputes, the Ed25519 signature is valid under the supplied JWKS/PEM, settlement reference is present, and any supplied artifact matches `artifacts.ubl_sha256`.

It does **not** mean a government accepted the determination.

## CLI

```bash
npx fiscal402-verify receipt.json --jwks jwks.json --ubl invoice.xml
```

Exit `0` only when the outcome is `VERIFIED`.

Outcomes (only checks that ran):

| outcome | meaning |
|---|---|
| `VERIFIED` | schema 1.0.0, payload match, valid Ed25519, known key, settlement present, artifact match if supplied |
| `UNSUPPORTED_VERSION` | `spec` / `spec_version` is not `fiscal402.receipt` / `1.0.0` |
| `UNKNOWN_KEY` | JWKS has no PEM for `signature.key_id` |
| `ARTIFACT_MISMATCH` | supplied UBL UTF-8 bytes do not hash to `artifacts.ubl_sha256` |
| `INVALID` | any other hard failure (bad signature, payload mismatch, missing settlement, …) |

## Dependencies

Runtime: Node.js `node:crypto` only.
