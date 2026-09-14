# @fiscal402/verify

Independent verifier for `fiscal402.receipt/1.0.0` and experimental `fiscal402.receipt/2.0.0`.

Works **offline** on frozen fixtures. No API key. Compatible ≠ calling `api.fiscal402.com`.

This package does **not** classify VAT, look up VIES, quote FX, or ingest settlements.
It checks receipt integrity: schema id, canonical payload, Ed25519 signature, JWKS key, and optional artifact hash.

The in-browser playground on https://www.fiscal402.com/docs/packages is a reference verifier, not a required network service.

## Publication status

**Current**

- source available on GitHub
- verifier builds locally
- CLI runs locally on `test-vectors/valid/`
- package **not published to npm yet**

**Planned**

- publish `@fiscal402/verify`
- enable `npx fiscal402-verify`

Do not run `npm install @fiscal402/verify` or `npx fiscal402-verify` expecting a registry package. Those do not exist yet.

## Install

This package is not published to npm yet.

```bash
git clone https://github.com/Fiscal402/Fiscal402.git
cd Fiscal402
npm install
npm run build --workspace=@fiscal402/verify
```

Then run the CLI from the repository root:

```bash
node packages/verify/dist/cli.js \
  test-vectors/valid/receipt.json \
  --jwks test-vectors/valid/jwks.json \
  --ubl test-vectors/valid/invoice.xml
```

v2:

```bash
node packages/verify/dist/cli.js \
  test-vectors/v2/valid/receipt.json \
  --jwks test-vectors/v2/valid/jwks.json \
  --artifact-id uk-vat-determination-1=test-vectors/v2/valid/uk-vat-determination.json
```

Exit `0` only when the outcome is `VERIFIED`. Exit `1` = not verified. Exit `2` = invalid invocation.

## API

After the workspace install/build above, this import resolves **inside this repository**. It is not an npm install for external projects.

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
  ubl, // v1 optional UTF-8 artifact bytes
  artifacts: [{ id: "uk-vat-determination-1", bytes }], // v2 optional
});

if (report.verified) {
  // cryptographic integrity only — not tax-authority acceptance
}
```

`verifyReceipt` dispatches on `spec_version`. `verifyFiscal402Receipt` remains the v1 function.

`verified` means the signed payload recomputes, the Ed25519 signature is valid under the supplied JWKS/PEM, a settlement reference is present, and any supplied artifact matches its bound digest.

It does **not** mean a government accepted the determination.

## CLI outcomes

Only checks that ran:

| outcome | meaning |
|---|---|
| `VERIFIED` | supported version, payload match, valid Ed25519, known key, settlement present, artifact match if supplied |
| `UNSUPPORTED_VERSION` | `spec` / `spec_version` is not a supported receipt version |
| `UNKNOWN_KEY` | JWKS has no PEM for `signature.key_id` |
| `ARTIFACT_MISMATCH` | supplied artifact bytes do not match the bound digest |
| `INVALID` | any other hard failure (bad signature, payload mismatch, malformed money, duplicate keys, …) |

The binary name is `fiscal402-verify` (`bin` in `package.json`). That name is for a future npm publication. Today, invoke `node packages/verify/dist/cli.js`.

## Planned npm usage

Not available yet:

```bash
# After publication
npm install @fiscal402/verify
npx fiscal402-verify receipt.json --jwks jwks.json --ubl invoice.xml
```

## Dependencies

Runtime: Node.js `node:crypto` only.
