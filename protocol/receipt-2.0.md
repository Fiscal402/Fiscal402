# fiscal402.receipt/2.0.0

Generic verifiable fiscal-event document. Additive to frozen [`fiscal402.receipt/1.0.0`](./receipt-1.0.md).

JSON Schema: [`schemas/fiscal402.receipt-2.0.0.schema.json`](../schemas/fiscal402.receipt-2.0.0.schema.json)

v1 remains the production default for x402 + EU VAT + UBL. v1 is **not deprecated**.

v2 exists because a second jurisdiction (UK VAT, experimental) cannot be projected onto the v1 EU/x402-shaped document without lying about fields such as `amount_usdc`, `vies`, and `ubl_sha256`.

## Identity

| Field | Value |
|---|---|
| `spec` | `fiscal402.receipt` |
| `spec_version` | `2.0.0` |

Unknown majors MUST NOT be interpreted as v1 or v2. Fail closed (`UNSUPPORTED_VERSION`).

## Design law

These are independent axes. v2 must not collapse them:

```
PAYMENT PROTOCOL
≠ SETTLEMENT NETWORK
≠ ASSET
≠ COMMERCIAL PARTY
≠ FISCAL JURISDICTION
≠ FISCAL DETERMINATION
≠ ARTIFACT
≠ RECEIPT FORMAT
```

There are no generic top-level fields named `amount_usdc`, `vat_eur`, `vies`, `ubl_sha256`, or `tx_hash`. Those v1 names stay on v1.

## Document

| Field | Type | Notes |
|---|---|---|
| `receipt_id` | string | Issuer id |
| `issued_at` | RFC 3339 UTC (`…Z`) | Set by issuer. No local timestamps. |
| `mode` | `sandbox` \| `production` \| `experimental` | Optional |
| `issuer` | object | `id`, optional `key_id` |
| `event` | object | Payment + parties + supply |
| `determinations` | array | One or more typed envelopes. Multi-jurisdiction composition is **not** specified. |
| `artifacts` | array | Generic bindings. May be empty. |
| `disclaimer` | string | Optional |
| `extensions` | object | Optional namespaced bags. Not a dumping ground for core semantics. |
| `integrity` | object | Canonicalization id + payload SHA-256. **Not** in the signed payload. |
| `signature` | object | Ed25519 over the hex digest string. **Not** in the signed payload. |

`additionalProperties` is **false** on signed core objects. Unknown core fields are invalid.

## Money

No JSON numbers for money. No IEEE-754.

```json
{
  "currency": "GBP",
  "amount_minor": "2000",
  "minor_unit": 2
}
```

- `amount_minor` is a decimal integer **string**: `0` or `[1-9][0-9]*`
- Negative amounts are invalid
- Leading zeros are invalid except `0`
- Maximum 78 digits
- `minor_unit` is an integer 0–18

Settlement **asset** amount is not money:

```json
{
  "identifier": "USDC",
  "amount_base_units": "2500000",
  "decimals": 6
}
```

USDC payment ≠ GBP taxable amount. Do not collapse them. Omit `tax_amount` when fiscal valuation is unavailable. Do not invent FX.

## Rates

```json
{ "numerator": "20", "denominator": "100" }
```

Both fields are integer strings. No floats. `denominator` ≥ 1.

## Payment

`event.payment.protocol` identifies the payment protocol (`x402`, `evm-transfer`, …).

`event.payment.settlement` identifies how value moved:

- `transaction_id` is **not** assumed to be an EVM `tx_hash`
- `network` is **not** assumed to be a blockchain
- `payer` / `payee` are payment identities, **not** legal persons

## Parties

`event.parties.seller` / `buyer` are commercial/fiscal roles. They are distinct from payment payer/payee.

A wallet is not a legal identity. Do not treat `payer.identifier` as a VAT id, country, or person.

## Determinations

See [v2-determinations.md](./v2-determinations.md).

## Artifacts

See [v2-artifacts.md](./v2-artifacts.md).

## Canonicalization

v2 **reuses** `fiscal402.sorted-json/1`.

Decision: the algorithm is already independently versioned, deterministic, UTF-8, key-sorted compact JSON, and suitable for v2 because money and rates are integer strings. A second algorithm would split verifiers without fixing a bug.

Rules that v2 producers MUST obey on top of sorted-json/1:

- No JSON numbers for money or rates
- No `NaN` / `Infinity`
- Timestamps are RFC 3339 UTC with `Z`
- Do not Unicode-normalize signed strings
- Do not emit duplicate JSON keys
- Do not emit `undefined`

See [canonicalization.md](./canonicalization.md).

Signed payload = the document **without** `integrity` and `signature` (and without `hashes` if present).

```
canonical = fiscal402.sorted-json/1(unsigned)
integrity.payload_sha256 = SHA-256(UTF-8 bytes of canonical)
signature.value = Ed25519(UTF-8 bytes of the hex digest string)
```

## Signature

Ed25519. Algorithm must be identified. Unknown algorithms fail closed.

Key discovery: JWKS (`kid` = `signature.key_id`) or an explicit PEM.

Same production key id as v1 (`receipt-ed25519-v1`) is allowed. This task does not rotate keys.

See [signatures.md](./signatures.md).

## Duplicate JSON keys

Producers MUST NOT emit duplicate keys.

Verifiers that receive the original JSON **text** MUST reject duplicate keys (`INVALID`). JavaScript `JSON.parse` of an already-parsed object cannot see duplicates; pass the raw string into `parseReceipt`.

## Status of this version

**EXPERIMENTAL.**

v2 is specified and independently verifiable. It is not the production default. EU x402 issuance continues to emit v1.

## Golden vector

Input (key order must not matter):

```json
{ "spec": "fiscal402.receipt", "spec_version": "2.0.0", "a": 1 }
```

`integrity.payload_sha256`:

```
ebcaf0dcddb4908ca6683847f8b2be9e0ce9c07399d4fc067e244505f3b1a3d4
```

This digest is **not** the v1 golden digest.
