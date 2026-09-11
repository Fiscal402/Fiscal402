# Fiscal402

Open protocol specification and verification tooling for verifiable fiscal events in autonomous commerce.

Fiscal402 is post-settlement fiscal infrastructure for autonomous commerce. It turns machine payments into a portable, cryptographically verifiable fiscal-event receipt. x402 v2 exact is the first supported payment protocol; EU VAT is the first production jurisdiction. Fiscal402 does not settle payments and does not custody customer funds.

> x402 moves the money. Fiscal402 makes the transaction fiscally usable.

> The public Fiscal402 protocol defines how fiscal evidence is represented and verified. Fiscal determination infrastructure remains proprietary.

## Public surfaces

- Website: [https://www.fiscal402.com](https://www.fiscal402.com)
- Protocol: [https://www.fiscal402.com/protocol](https://www.fiscal402.com/protocol)
- Verification: [https://www.fiscal402.com/verify](https://www.fiscal402.com/verify)
- API discovery: [https://api.fiscal402.com/.well-known/fiscal402.json](https://api.fiscal402.com/.well-known/fiscal402.json)
- This repository: specification, JSON Schema, test vectors, source-only verifier
- Public contract: [docs/PUBLIC_CONTRACT.md](docs/PUBLIC_CONTRACT.md) (`npm run check:public` / `npm run check:public:live`)

## Current production implementation

```
x402 v2 exact
  → EU fiscal determination
  → UBL / ledger
  → fiscal402.receipt/1.0.0
```

x402 is the first supported payment protocol.

## Receipt versions

| Version | Status | Role |
|---|---|---|
| `fiscal402.receipt/1.0.0` | supported, frozen | EU / x402 compatibility format |
| `fiscal402.receipt/2.0.0` | experimental | generic multi-rail / multi-jurisdiction format |

v1 is not deprecated. There is no migration requirement for v1 consumers.

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

**Not implemented**

| Piece | Status |
|---|---|
| MPP | not implemented |
| AP2 | not implemented |
| US sales tax | not implemented |
| Canada | not implemented |
| GBP FX | not implemented |
| generic FX | not implemented |
| Solana settlement verification | not implemented |

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

The verifier is not published to npm yet.

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

## License

Apache-2.0
