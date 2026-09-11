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

## Experimental generic path (receipt v2)

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
   ├── fiscal402.receipt/1.0.0   (EU compatibility, production default)
   └── fiscal402.receipt/2.0.0   (generic fiscal event, experimental)
```

UK VAT is the first non-EU v2 vertical. It is **experimental**. It does not emit a statutory UK VAT invoice and does not invent GBP FX.

The diagram above is the execution architecture. `FiscalDetermination` is **output** from processing a `FiscalEvent`. It is not an input to `FiscalEvent`.

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

The execution pipeline uses these types internally. They are **not** frozen public documents except as projected onto `fiscal402.receipt`:

```
payment protocol
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
```

Do not treat `PaymentEvidence` / `FiscalEvent` as a published interchange format unless a later spec version freezes them.

## Status (honest)

| Piece | Status |
|---|---|
| x402 v2 exact | supported (HTTP ingest) |
| evm-transfer | supported at library level; HTTP ingest is **not** public |
| MPP / AP2 | planned, not implemented |
| EU VAT | production |
| UK VAT determination | experimental |
| UK statutory invoice | not implemented |
| US sales tax | not implemented |
| receipt 1.0.0 | supported (frozen) |
| receipt 2.0.0 | experimental |
| GBP FX | not implemented |

## Documents in this directory

| File | What it freezes |
|---|---|
| [receipt-1.0.md](./receipt-1.0.md) | `fiscal402.receipt/1.0.0` fields |
| [receipt-2.0.md](./receipt-2.0.md) | `fiscal402.receipt/2.0.0` fields |
| [v2-determinations.md](./v2-determinations.md) | v2 determination envelope |
| [v2-artifacts.md](./v2-artifacts.md) | v2 artifact envelope |
| [canonicalization.md](./canonicalization.md) | `fiscal402.sorted-json/1` |
| [signatures.md](./signatures.md) | Ed25519 + JWKS |
| [artifact-binding.md](./artifact-binding.md) | UBL UTF-8 SHA-256, no C14N (v1) |
| [verification.md](./verification.md) | What VERIFIED means |
| [versioning.md](./versioning.md) | Independent version axes |
| [discovery.md](./discovery.md) | `/.well-known/fiscal402.json` convention |

## What this repo is not

- Not the tax engine
- Not VIES orchestration
- Not settlement ingest
- Not a claim of tax-authority acceptance
