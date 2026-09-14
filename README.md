# Fiscal402

x402 is the payment standard (HTTP 402 + settle).
Fiscal402 Protocol is the post-settlement evidence standard.
The company trading as Fiscal402 is the first production issuer and the first EU determination engine. It is not the only allowed issuer in the spec.

If a machine payment has settled, this is the portable object that can exist afterwards — whoever runs the tax engine.

Fiscal402 is not x402. x402 handles payment authorization and settlement. It does not by itself determine VAT.

| Surface | Status |
|---|---|
| `fiscal402.receipt/1.0.0` | frozen |
| verifier | source-only; runs offline on fixtures |
| engine | proprietary (one conforming implementation) |

The spec allows multiple issuers; today one production issuer is listed.

## Implement a verifier

Independent verification does not require `api.fiscal402.com` and does not require the company’s EU engine.

```bash
git clone https://github.com/Fiscal402/Fiscal402.git
cd Fiscal402
npm install
npm run build
node packages/verify/dist/cli.js \
  test-vectors/valid/receipt.json \
  --jwks test-vectors/valid/jwks.json \
  --ubl test-vectors/valid/invoice.xml
```

No API key. Exit `0` = `VERIFIED`. Exit `1` = not verified (`INVALID` / `UNKNOWN_KEY` / `ARTIFACT_MISMATCH`). Exit `2` = invalid invocation.

The verifier is not published to npm. Do not `npm install @fiscal402/verify`.

See [packages/verify/README.md](packages/verify/README.md) and [https://www.fiscal402.com/protocol/implement-verifier](https://www.fiscal402.com/protocol/implement-verifier).

v2 (experimental UK technical fixture):

```bash
node packages/verify/dist/cli.js \
  test-vectors/v2/valid/receipt.json \
  --jwks test-vectors/v2/valid/jwks.json \
  --artifact-id uk-vat-determination-1=test-vectors/v2/valid/uk-vat-determination.json
```

## Compatibility

A system is Fiscal402-compatible if it can do at least one of:

### A. Verify

- Accept `fiscal402.receipt/1.0.0`
- Canonicalize with `fiscal402.sorted-json/1`
- Check Ed25519 over the canonical payload hash
- Resolve `kid` via issuer JWKS
- If an artifact is bound, check sha256 of exact UTF-8 UBL 2.1 bytes
- Emit `VERIFIED` | `INVALID` | `UNKNOWN_KEY` | `ARTIFACT_MISMATCH` with the existing meanings

### B. Issue

- Emit `receipt/1.0.0` that passes the public v1 test vectors / schema
- Publish JWKS
- Bind settlement evidence + determination summary + artifact hashes as already specified
- Fail closed when a corridor is not production (no guessed rates)

### C. Consume

- Persist receipt + bound UBL hash
- Treat `VERIFIED` as integrity only
- Not treat the receipt as a VAT return

Compatible ≠ “uses api.fiscal402.com”.
Compatible ≠ “uses the company’s EU engine”.
The company’s engine is one conforming implementation.

Full text: [docs/COMPATIBILITY.md](docs/COMPATIBILITY.md).

## Call the hosted API

The company API is one issuer’s hosted product. It is not the spec.

- Website: [https://www.fiscal402.com](https://www.fiscal402.com)
- Protocol: [https://www.fiscal402.com/protocol](https://www.fiscal402.com/protocol)
- Receipt spec: [https://www.fiscal402.com/protocol/receipt](https://www.fiscal402.com/protocol/receipt)
- Facts (pricing, legal entity, production corridors): [https://www.fiscal402.com/facts.json](https://www.fiscal402.com/facts.json)
- Legal: [https://www.fiscal402.com/legal](https://www.fiscal402.com/legal)
- API: [https://api.fiscal402.com](https://api.fiscal402.com)
- OpenAPI: [https://api.fiscal402.com/openapi.json](https://api.fiscal402.com/openapi.json)
- JWKS: [https://api.fiscal402.com/.well-known/jwks.json](https://api.fiscal402.com/.well-known/jwks.json)
- Public contract: [docs/PUBLIC_CONTRACT.md](docs/PUBLIC_CONTRACT.md) (`npm run check:public` / `npm run check:public:live`)

## Current production implementation (company engine)

```
x402 v2 exact
  → EU fiscal determination
  → UBL 2.1
  → fiscal402.receipt/1.0.0
  → independent verification
```

x402 is the first supported payment protocol. Global event support is not global tax determination. EU VAT is the only production-verified jurisdiction engine.

## Receipt versions

| Version | Status | Role |
|---|---|---|
| `fiscal402.receipt/1.0.0` | supported, frozen | EU / x402 compatibility format |
| `fiscal402.receipt/2.0.0` | experimental | generic multi-rail / multi-jurisdiction format |

v1 is not deprecated. There is no migration requirement for v1 consumers. New jurisdiction = new ruleset id or v2. Never overload v1 semantics.

## Status

**Current**

| Piece | Status |
|---|---|
| x402 v2 exact | supported |
| EU VAT | production implementation (proprietary execution) |
| UBL 2.1 | supported (exact UTF-8 bytes, no XML C14N) |
| receipt 1.0.0 | supported |
| Ed25519 verification | supported |

**Experimental**

| Piece | Status |
|---|---|
| receipt 2.0.0 | specified + independently verifiable |
| UK VAT determination | experimental; not a statutory invoice |
| evm-transfer adapter | library-level; HTTP ingest is not public |

**Not implemented as production**

| Piece | Status |
|---|---|
| MPP HTTP ingest | not production ingest; evidence profile exists on the website |
| AP2 | authorization evidence only; a mandate is not settlement |
| US sales tax | MANUAL_REVIEW provider boundary; no native rate table |
| Canada GST/HST/QST/PST | experimental digital engines on the website; not production-verified |
| npm-published verifier | source-only |

## Architecture (execution, not v1 wire format)

```
Payment Protocol
      ↓
PaymentAdapter
      ↓
PaymentEvidence
      ↓
FiscalEvent
      ↓
JurisdictionRouter
      ↓
FiscalDetermination
      ↓
FiscalArtifact[]
      ↓
Receipt Kernel
      ↓
Receipt Projection
   ├─ fiscal402.receipt/1.0.0
   └─ fiscal402.receipt/2.0.0
```

`FiscalDetermination` is **output** from processing a `FiscalEvent`.

## Public interoperability

```
payment rails
      ↓
issuer processing             ← proprietary (one conforming implementation)
      ↓
fiscal402.receipt             ← this repository
      ↓
agents / ERP / marketplaces / accounting
      ↓
independent verification      ← @fiscal402/verify (source-only)
```

The ecosystem-facing primitive is **`fiscal402.receipt`**.

## Legal

Fiscal402 is a trade name of a Netherlands B.V. During beta the holding company is the contracting and receipt-issuing entity. Statutory name, KvK and VAT ID are published at [https://www.fiscal402.com/legal](https://www.fiscal402.com/legal) once registered. They are not invented in this repository.

Receipt v1 is frozen. Legal issuer metadata lives on `/legal`, JWKS, and optional receipt v2 experimental fields. Verification proves cryptographic integrity, not legal validity.

Contact: hello@fiscal402.com · legal@fiscal402.com · privacy@fiscal402.com · [GitHub issues](https://github.com/Fiscal402/Fiscal402/issues). Do not send private keys, customer VAT IDs, or personal invoice data to public issues.

## Suggested topics

`x402` `machine-payments` `agentic-commerce` `vat` `eu-vat` `ubl` `en16931` `fiscal-receipts` `fiscal`

## License

Apache-2.0
