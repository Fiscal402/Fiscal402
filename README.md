# Fiscal402

Fiscal infrastructure for autonomous commerce.

Turn settled machine payments into verifiable fiscal events.

Fiscal402 is post-settlement fiscal infrastructure. It processes supported settled machine payments into durable fiscal events and verifiable fiscal artifacts. x402 v2 exact is the production payment protocol; EU VAT is the production jurisdiction engine. Fiscal402 does not settle payments and does not custody customer funds.

> x402 handles payment authorization and settlement. It does not by itself determine VAT.

> x402 moves the payment; Fiscal402 handles the post-settlement fiscal event.

> The public Fiscal402 protocol defines how fiscal evidence is represented and verified. Fiscal determination infrastructure remains proprietary.

## Public surfaces

- Website: [https://www.fiscal402.com](https://www.fiscal402.com)
- x402 VAT: [https://www.fiscal402.com/x402/vat](https://www.fiscal402.com/x402/vat)
- x402 fiscal receipts: [https://www.fiscal402.com/x402/fiscal-receipts](https://www.fiscal402.com/x402/fiscal-receipts)
- Protocol: [https://www.fiscal402.com/protocol](https://www.fiscal402.com/protocol)
- Receipt spec: [https://www.fiscal402.com/protocol/receipt](https://www.fiscal402.com/protocol/receipt)
- Canonicalization: [https://www.fiscal402.com/protocol/canonicalization](https://www.fiscal402.com/protocol/canonicalization)
- Verification: [https://www.fiscal402.com/docs/verification](https://www.fiscal402.com/docs/verification)
- Facts: [https://www.fiscal402.com/facts](https://www.fiscal402.com/facts)
- API: [https://api.fiscal402.com](https://api.fiscal402.com)
- API docs: [https://api.fiscal402.com/docs](https://api.fiscal402.com/docs)
- API reference: [https://api.fiscal402.com/reference](https://api.fiscal402.com/reference)
- OpenAPI: [https://api.fiscal402.com/openapi.json](https://api.fiscal402.com/openapi.json)
- Capabilities: [https://api.fiscal402.com/v1/capabilities](https://api.fiscal402.com/v1/capabilities)
- API discovery: [https://api.fiscal402.com/.well-known/fiscal402.json](https://api.fiscal402.com/.well-known/fiscal402.json)
- This repository: specification, JSON Schema, test vectors, source-only verifier
- Public contract: [docs/PUBLIC_CONTRACT.md](docs/PUBLIC_CONTRACT.md) (`npm run check:public` / `npm run check:public:live`)

## Current production implementation

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

v1 is not deprecated. There is no migration requirement for v1 consumers.

## Status

**Current**

| Piece | Status |
|---|---|---|
| x402 v2 exact | supported |
| EU VAT | production implementation (proprietary execution) |
| UBL 2.1 | supported (exact UTF-8 bytes, no XML C14N) |
| receipt 1.0.0 | supported |
| Ed25519 verification | supported |

**Experimental**

| Piece | Status |
|---|---|---|
| receipt 2.0.0 | specified + independently verifiable |
| UK VAT determination | experimental; not a statutory invoice |
| evm-transfer adapter | library-level; HTTP ingest is not public |

**Not implemented as production**

| Piece | Status |
|---|---|---|
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
   ├── fiscal402.receipt/1.0.0
   └── fiscal402.receipt/2.0.0
```

`FiscalDetermination` is **output** from processing a `FiscalEvent`.

## Public interoperability

```
payment rails
      ↓
Fiscal402 processing          ← proprietary
      ↓
fiscal402.receipt             ← this repository
      ↓
agents / ERP / marketplaces / accounting
      ↓
independent verification      ← @fiscal402/verify (source-only)
```

The ecosystem-facing primitive is **`fiscal402.receipt`**.

## Verify locally

The verifier is not published to npm yet. Do not `npm install @fiscal402/verify`.

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

v2 (experimental UK technical fixture):

```bash
node packages/verify/dist/cli.js \
  test-vectors/v2/valid/receipt.json \
  --jwks test-vectors/v2/valid/jwks.json \
  --artifact-id uk-vat-determination-1=test-vectors/v2/valid/uk-vat-determination.json
```

## Suggested topics

`x402` `machine-payments` `agentic-commerce` `vat` `eu-vat` `ubl` `en16931` `fiscal-receipts` `fiscal`

## License

Apache-2.0
