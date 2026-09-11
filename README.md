# Fiscal402

Open protocol specification and verification tooling for verifiable fiscal events in autonomous commerce.

Fiscal402 defines a portable, cryptographically verifiable fiscal-event receipt format for machine commerce.

> x402 moves the money. Fiscal402 makes the transaction fiscally usable.

> The public Fiscal402 protocol defines how fiscal evidence is represented and verified. Fiscal determination infrastructure may remain proprietary.

## Current production implementation

```
x402 v2 exact
  → EU fiscal determination
  → UBL / ledger
  → fiscal402.receipt/1.0.0
```

x402 is the first supported payment protocol.

## Status

**Current**

| Piece | Status |
|---|---|
| x402 v2 exact | supported |
| EU VAT | production implementation (proprietary execution) |
| UBL 2.1 | supported (exact UTF-8 bytes, no XML C14N) |
| receipt 1.0.0 | supported |
| Ed25519 verification | supported |

**Not implemented**

| Piece | Status |
|---|---|
| MPP | not implemented |
| AP2 | not implemented |
| US sales tax | not implemented |
| UK VAT | not implemented |
| Canada | not implemented |
| receipt v2 | not implemented |
| generic FX | not implemented |
| Solana settlement verification | not implemented |

## North star (direction, not a claim)

```
ANY PAYMENT RAIL.
ANY JURISDICTION.
ONE VERIFIABLE FISCAL EVENT.
```

Today that is architecture, not inventory.

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
independent verification      ← @fiscal402/verify
```

The ecosystem-facing primitive is **`fiscal402.receipt`**.

## Verify a receipt

```bash
npx fiscal402-verify receipt.json --jwks jwks.json --ubl invoice.xml
```

From this repository after `npm run build --workspace=@fiscal402/verify`:

```bash
node packages/verify/dist/cli.js \
  test-vectors/valid/receipt.json \
  --jwks test-vectors/valid/jwks.json \
  --ubl test-vectors/valid/invoice.xml
```

TypeScript:

```ts
import { parseReceipt, verifyReceipt } from "@fiscal402/verify";

const report = verifyReceipt({
  receipt: parseReceipt(receiptJson),
  jwks,
  ubl,
});
// report.verified === cryptographic integrity
// it is not tax-authority acceptance
```

## Repository layout

| Path | Contents |
|---|---|
| `protocol/` | receipt, canonicalization, signatures, artifacts, verification |
| `schemas/` | `fiscal402.receipt-1.0.0` JSON Schema |
| `packages/verify/` | independent verifier (Node `crypto` only) |
| `test-vectors/` | sanitized fixtures |
| `examples/consumer/` | downstream-style verify + inspect |

## Pricing (commercial, not this repo)

Standard Fiscal402 pricing: **50 bps**. Custom high-volume pricing is available commercially. This repository does not contain billing or fee-collection code.

## What “open” means here

Open protocol surface + open verification. Fiscal execution (VAT classification, VIES, FX, ingest, persistence) stays proprietary.

See [protocol/README.md](./protocol/README.md).

## License

Apache License 2.0. See [LICENSE](./LICENSE).
