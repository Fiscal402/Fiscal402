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

The verifier lives in this repository. **It is not published to npm yet.**

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

Exit `0` only when the outcome is `VERIFIED`. That is cryptographic integrity, not tax-authority acceptance.

TypeScript against the **workspace package** (after `npm install` / `npm run build` in this repo):

```ts
import { parseReceipt, verifyReceipt } from "@fiscal402/verify";

const report = verifyReceipt({
  receipt: parseReceipt(receiptJson),
  jwks,
  ubl,
});
```

That import does **not** work from npm today. External consumers clone this repo.

Planned npm usage (not available yet):

```bash
# After @fiscal402/verify is published
npx fiscal402-verify receipt.json --jwks jwks.json --ubl invoice.xml
```

## Publication status

**Current**

- source on GitHub
- verifier builds locally
- CLI runs locally
- package **not** published to npm

**Planned**

- publish `@fiscal402/verify`
- enable `npx fiscal402-verify`

## Repository layout

| Path | Contents |
|---|---|
| `protocol/` | receipt, canonicalization, signatures, artifacts, verification |
| `schemas/` | `fiscal402.receipt-1.0.0` JSON Schema |
| `packages/verify/` | independent verifier (Node `crypto` only) |
| `test-vectors/` | sanitized fixtures |
| `examples/consumer/` | downstream-style verify + inspect |

## Pricing (commercial, not this repo)

Fiscal402 is free during beta at **0 bps**. That is not permanently free. Standard rate after beta: **50 bps / 0.5%** of fiscalized volume. High-volume pricing is custom. This repository does not contain billing or fee-collection code.

## What “open” means here

Open protocol surface + open verification. Fiscal execution (VAT classification, VIES, FX, ingest, persistence) stays proprietary.

See [protocol/README.md](./protocol/README.md).

## License

Apache License 2.0. See [LICENSE](./LICENSE).
