# Verification semantics

## VERIFIED may mean

- `spec` is `fiscal402.receipt` and `spec_version` is `1.0.0`
- canonical payload SHA-256 recomputes (`fiscal402.sorted-json/1`)
- Ed25519 signature is valid
- expected JWKS key (`signature.key_id`) was found
- artifact hash matches **when artifact bytes are supplied**
- settlement `network` and `tx_hash` are present

## VERIFIED does not mean

- government approved
- tax authority accepted
- legally correct in every jurisdiction
- wallet equals legal identity
- complete regulatory compliance
- the bound UBL would be accepted by a clearance network
- the payment actually settled on chain (the receipt *claims* a settlement reference; this verifier does not check a chain)

Every successful report includes a note:

> verified means Fiscal402 receipt integrity, not tax-authority acceptance.

## Result values

| `result` | meaning |
|---|---|
| `VERIFIED` | hard checks passed; signature valid; settlement reference present |
| `INVALID` | schema, signature, payload, key, artifact, or settlement check failed |
| `INCOMPLETE` | not a hard fail, but not enough to claim VERIFIED |

## CLI outcomes

Mapped from the same report, without extra checks:

| outcome | when |
|---|---|
| `VERIFIED` | `result === "VERIFIED"` |
| `UNSUPPORTED_VERSION` | spec / version missing or not 1.0.0 |
| `UNKNOWN_KEY` | JWKS has no PEM for `key_id` |
| `ARTIFACT_MISMATCH` | supplied UBL does not match `ubl_sha256` |
| `INVALID` | other hard failure |

## Wallet identity

`context.fiscal.wallet_is_legal_identity` is `false` on production receipts. A blockchain wallet is payment identity. It is not a legal person, country, or VAT identity.
