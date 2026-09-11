# Fiscal402 protocol

The public interoperability surface is `fiscal402.receipt`.

## Current production path

```
x402 v2 exact
      ↓
Fiscal402 private execution
      ↓
fiscal402.receipt/1.0.0
```

x402 is the first supported payment protocol. EU VAT is the first production jurisdiction. Neither is the long-term architectural boundary.

## Public interoperability

```
fiscal402.receipt
      ↓
schema + canonicalization + Ed25519 + artifact binding
      ↓
independent verification
      ↓
any compatible consumer (agent, ERP, marketplace, accounting)
```

A consumer does not need Fiscal402's execution engine to verify a receipt.

## Internal conceptual model (not a public v1 wire format)

The execution pipeline uses these types internally. They are **not** frozen public documents in this repository:

```
payment protocol
      ↓
PaymentEvidence
      ↓
FiscalEvent
      ↓
FiscalDetermination
      ↓
FiscalArtifact[]
      ↓
fiscal402.receipt
```

Do not treat `PaymentEvidence` / `FiscalEvent` as a published interchange format unless a later spec version freezes them.

## Future architecture (not implemented)

```
multiple payment rails
      ↓
common FiscalEvent model
      ↓
multiple jurisdiction engines
      ↓
common verifiable receipt layer
```

Direction, not a capability claim:

> ANY PAYMENT RAIL. ANY JURISDICTION. ONE VERIFIABLE FISCAL EVENT.

Today: **one rail (x402), one jurisdiction (EU VAT), one receipt version (1.0.0).**

## Documents in this directory

| File | What it freezes |
|---|---|
| [receipt-1.0.md](./receipt-1.0.md) | `fiscal402.receipt/1.0.0` fields |
| [canonicalization.md](./canonicalization.md) | `fiscal402.sorted-json/1` |
| [signatures.md](./signatures.md) | Ed25519 + JWKS |
| [artifact-binding.md](./artifact-binding.md) | UBL UTF-8 SHA-256, no C14N |
| [verification.md](./verification.md) | What VERIFIED means |
| [versioning.md](./versioning.md) | Independent version axes |
| [discovery.md](./discovery.md) | `/.well-known/fiscal402.json` convention |

## What this repo is not

- Not the tax engine
- Not VIES orchestration
- Not settlement ingest
- Not a claim of tax-authority acceptance
