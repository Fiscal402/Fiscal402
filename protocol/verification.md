# Verification semantics

Verification is offline. A verifier needs the receipt, public key/JWKS, and optionally artifact bytes. It does **not** need the Fiscal402 API, a database, a tax engine, VIES, or an FX provider.

Cryptographic verification ≠ tax correctness.

## v1 VERIFIED may mean

- `spec` is `fiscal402.receipt` and `spec_version` is `1.0.0`
- canonical payload SHA-256 recomputes (`fiscal402.sorted-json/1`)
- Ed25519 signature is valid
- expected JWKS key (`signature.key_id`) was found
- artifact hash matches **when artifact bytes are supplied**
- settlement `network` and `tx_hash` are present

## v2 VERIFIED may mean

- `spec` is `fiscal402.receipt` and `spec_version` is `2.0.0`
- schema/structure is valid (required fields, integer money, RFC 3339 UTC, no unknown core fields)
- duplicate JSON keys were not present in the source text
- canonical payload recomputes (`fiscal402.sorted-json/1`)
- `integrity.payload_sha256` matches
- Ed25519 signature is valid
- issuer key resolved via JWKS or PEM
- referenced supplied artifacts match exact hashes
- `event.payment.settlement.transaction_id` is present
- unknown algorithms / unknown canonicalization / unknown versions fail closed

## VERIFIED does not mean

- government approved
- tax authority accepted
- tax filing
- legally correct in every jurisdiction
- wallet equals legal identity
- complete regulatory compliance
- correct tax-law interpretation
- legal identity validation
- the bound artifact would be accepted as a statutory invoice
- the payment actually settled on chain (the receipt *claims* a settlement reference; this verifier does not check a chain)

Every successful report includes a note:

> verified means Fiscal402 receipt integrity, not tax-authority acceptance.

## Result values

| `result` | meaning |
|---|---|
| `VERIFIED` | hard checks passed; signature valid; settlement reference present |
| `INVALID` | schema, signature, payload, key, artifact, money, or settlement check failed |
| `INCOMPLETE` | not a hard fail, but not enough to claim VERIFIED |

## CLI outcomes

Mapped from the same report, without extra checks:

| outcome | when |
|---|---|
| `VERIFIED` | `result === "VERIFIED"` |
| `UNSUPPORTED_VERSION` | spec / version missing or not a supported receipt version |
| `UNKNOWN_KEY` | JWKS has no PEM for `key_id` |
| `ARTIFACT_MISMATCH` | supplied artifact bytes do not match the bound digest |
| `INVALID` | other hard failure |

## Wallet identity

A blockchain wallet is payment identity. It is not a legal person, country, or VAT identity. v1 receipts set `context.fiscal.wallet_is_legal_identity` to `false`. v2 keeps payer/payee under `event.payment.settlement` and commercial parties under `event.parties`.
