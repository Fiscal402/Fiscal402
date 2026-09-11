# fiscal402.receipt/1.0.0

Frozen production receipt. Do not “neutralize” v1 fields.

JSON Schema: [`schemas/fiscal402.receipt-1.0.0.schema.json`](../schemas/fiscal402.receipt-1.0.0.schema.json)

## Identity

| Field | Value |
|---|---|
| `spec` | `fiscal402.receipt` |
| `spec_version` | `1.0.0` |

Unknown majors are not v1.

## Document

| Field | Type | Notes |
|---|---|---|
| `receipt_id` | string | Issuer id, typically `rcpt_…` |
| `mode` | `sandbox` \| `production` | Sandbox receipts are not production fiscal records |
| `issued_at` | ISO-8601 string | Set by issuer |
| `protocol_version` | string | Issuer backend version (currently `0.3.0`) |
| `tax_ruleset_version` | string | Issuer ruleset (currently `eu-vat-oss-2026.09`) |
| `disclaimer` | string | Technical classification; not tax advice |

## `settlement`

v1 is x402/USDC-shaped. That is compatibility, not a claim that every rail looks like this.

| Field | Type |
|---|---|
| `network` | string (e.g. `eip155:8453`, `eip155:1`) |
| `tx_hash` | string |
| `amount_usdc` | decimal string |
| `asset` | string (production: `USDC`) |
| `payer` | string |
| `pay_to` | string |
| `settled_at` | ISO-8601 string |

## `context`

Evidence labels. Production includes:

- `payment` — copy of settlement identity
- `commercial.customer_country` — `{ value, source, evidence_ref, confidence, note? }`
- `commercial.customer_vat_id` — `{ provided, source, evidence_ref }`
- `commercial.service`
- `fiscal.seller_country`
- `fiscal.wallet_is_legal_identity` — `false`
- `fiscal.note` — wallet is not a legal person

Country `source` values in production: `merchant_attested`, `ip_signal`, `wallet_metadata_signal`, `fallback_seller_country`.

## `determination`

EU VAT-shaped on v1:

| Field | Type |
|---|---|
| `regime` | string (`OSS_B2C`, `REVERSE_CHARGE_B2B`, `DOMESTIC_B2C`, `DOMESTIC_B2B`, …) |
| `tax_category` | string (`S`, `AE`, …) |
| `rate_percent` | number |
| `taxing_country` | string |
| `legal_reference` | string |
| `provenance` | object (ruleset, reasons, location confidence) |

## `fx`

USDC → EUR on v1:

| Field | Type |
|---|---|
| `eur_per_usdc` | number |
| `as_of` | string |
| `source` | string |
| `net_eur` | decimal string |
| `vat_eur` | decimal string |

## `vies`

| Field | Type |
|---|---|
| `status` | string (`VALID`, `NOT_PROVIDED`, `NOT_CONFIRMED`, `PENDING_MANUAL_REVIEW`, …) |
| `vat_id_hash` | SHA-256 hex of the VAT id, or `null` |

The raw VAT number is not on the receipt.

## `artifacts`

See [artifact-binding.md](./artifact-binding.md).

## `hashes` / `signature`

See [canonicalization.md](./canonicalization.md) and [signatures.md](./signatures.md).

## Compatibility debt (intentional)

These v1 fields stay until receipt v2 is justified by a second rail or jurisdiction:

- `amount_usdc`
- `vies`
- `x402-…` settlement / ledger ids
- EU VAT regime names

## Signed vs unsigned

Everything except `hashes` and `signature` is in the canonical payload.
