# Fiscal402 protocol

x402 is the payment standard (HTTP 402 + settle).
Fiscal402 Protocol is the post-settlement evidence standard.
The company trading as Fiscal402 is the first production issuer and the first EU determination engine. It is not the only allowed issuer in the spec.

If a machine payment has settled, this is the portable object that can exist afterwards — whoever runs the tax engine.

The public interoperability surface is `fiscal402.receipt`. Fiscal402 is not x402.

The spec allows multiple issuers; today one production issuer is listed.

## Split

- **Protocol** — how fiscal evidence is represented and verified
- **Company** — hosted determination, event history, production EU engine
- **x402** — payment rail. Fiscal402 does not settle or facilitate.

Hosted product facts (pricing, legal entity, production corridors) live in [https://www.fiscal402.com/facts.json](https://www.fiscal402.com/facts.json). Do not duplicate drifting numbers here.

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

See [docs/COMPATIBILITY.md](../docs/COMPATIBILITY.md).

## Conformance

Frozen v1 fixtures: `test-vectors/valid/`. A class A verifier must return `VERIFIED` on those bytes without calling `api.fiscal402.com`.

v1 receipts are verified by JWKS + `kid`. Legal entity is an out-of-band issuer registry (website `/legal` + `facts.json legal.*`). Do not add KvK as a required v1 field.

JSON Schema: [`schemas/fiscal402.receipt-1.0.0.schema.json`](../schemas/fiscal402.receipt-1.0.0.schema.json) — required fields are frozen: `spec`, `spec_version`, `settlement`, `artifacts`, `hashes`, `signature`.

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
- Not a Fiscal402 Foundation
- Not a second production issuer
