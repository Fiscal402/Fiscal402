# v2 artifacts

v2 artifacts are generic bindings. UBL is one artifact type, not a global requirement.

## Envelope

| Field | Required | Meaning |
|---|---|---|
| `id` | yes | Artifact id |
| `type` | yes | Stable type token |
| `media_type` | yes | IANA media type |
| `hash.alg` | yes | `sha256` |
| `hash.value` | yes | Lowercase hex SHA-256 of **exact bytes** |
| `statutory_invoice` | no | `true` only if the bytes are a statutory invoice |

Hash exact bytes. Do not parse and re-serialize before hashing. Do not apply XML C14N.

Unknown `hash.alg` values fail closed.

## Type tokens (non-exhaustive)

| `type` | When |
|---|---|
| `ubl.invoice` | UBL 2.1 invoice (v1 production path; also valid as a v2 artifact) |
| `ledger.entry` | Ledger record |
| `fiscal402.uk-vat-determination+json` | Technical UK VAT determination JSON |
| `tax.evidence` | Generic tax evidence |
| `jurisdiction.report` | Generic jurisdiction report |

## UK technical artifact

A fully compliant UK VAT invoice cannot be produced from currently available Fiscal402 data (no GBP valuation, no statutory invoice field set, no HMRC live check).

UK v2 issuance therefore binds a **technical determination artifact**:

- `type`: `fiscal402.uk-vat-determination+json`
- `media_type`: `application/json`
- `statutory_invoice`: `false`

The artifact MUST state that it is **not a substitute for a statutory VAT invoice**.

Do not pretend a generic JSON blob is a legally compliant UK VAT invoice.

## Verification

When artifact bytes are supplied, the verifier hashes them with SHA-256 over the exact UTF-8 (or raw) bytes and compares to `hash.value`.

Mismatch → `ARTIFACT_MISMATCH` / `INVALID`.

Bytes not supplied → artifact check is `NOT_PROVIDED`. Cryptographic receipt verification can still succeed; the missing artifact is not inferred to match.

## v1 relationship

v1 binds UBL as `artifacts.ubl_sha256` with `ubl_hash_alg = sha256-utf8-bytes`. That object shape is frozen on v1.

v2 uses the array envelope above. A v2 producer MAY bind a UBL invoice as `{ "type": "ubl.invoice", "media_type": "application/xml", "hash": { "alg": "sha256", "value": "…" } }` using the same exact-bytes SHA-256.
