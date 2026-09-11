# v2 determinations

A v2 receipt carries `determinations[]`. Each item is a **typed envelope**, not a dump of a private TypeScript class.

Array shape is future-safe. Multi-jurisdiction composition is **not** specified. A producer MAY emit one determination. Consumers MUST NOT invent a combined tax result from multiple items.

## Envelope

| Field | Required | Meaning |
|---|---|---|
| `jurisdiction` | yes | Stable identifier. Not required to be ISO 3166-1. Example: `GB`, `EU`, future `US-CA`. |
| `regime` | yes | Tax regime family. Example: `uk-vat`, `eu-vat`. Not a VAT-only kernel. |
| `engine` | yes | Engine id that produced the result. Example: `uk-vat` |
| `ruleset_version` | yes | Independent of receipt version. Example: `uk-vat-2026.09` |
| `status` | yes | `DETERMINED` \| `MANUAL_REVIEW` \| `UNDETERMINED` |
| `category` | no | Stable treatment label, e.g. `standard_rate` |
| `rate` | no | `{ numerator, denominator }` integer strings |
| `taxable_amount` | no | Integer money. Omit when fiscal valuation is unavailable. |
| `tax_amount` | no | Integer money. Omit when fiscal valuation is unavailable. |
| `legal_reference` | no | Short citation, not a legal document |
| `provenance` | no | Machine-readable ruleset provenance |
| `extensions` | no | Namespaced jurisdiction-specific data |

`additionalProperties` is false on the envelope. Jurisdiction-specific evidence belongs in `extensions["uk-vat"]` (or another namespace), never as ad-hoc top-level fields.

## Status semantics

| Status | Producer | Consumer |
|---|---|---|
| `DETERMINED` | Final supported result. Rate may be present. Amounts only if valuation exists. | Integrity verification does not prove tax-law correctness. |
| `MANUAL_REVIEW` | **Do not issue** a normal finalized receipt. If a document is issued at all, it MUST NOT fill `rate` / `tax_amount` with guesses. | Cryptographic verification ≠ a tax result. |
| `UNDETERMINED` | No result. Do not guess. | Same. |

Never serialize guessed tax amounts just to fill fields.

## Provenance

```json
{
  "authority": "HMRC / Value Added Tax Act 1994",
  "source_url": "https://www.gov.uk/guidance/rates-of-vat-on-different-goods-and-services",
  "retrieved_at": "2026-09-11",
  "effective_from": "2011-01-04"
}
```

Do not embed full legal documents.

Historical rate safety is a producer concern: a settlement outside a known rate window MUST be `MANUAL_REVIEW` / `historical_rate_not_in_ruleset`, not a retroactive present-day rate.

## UK VAT (first v2 vertical)

Experimental. Bounded:

- UK-established supplier → UK customer
- electronically supplied services
- standard 20% (`numerator` `20` / `denominator` `100`)
- domestic B2B remains 20% under current implemented scope (no reverse charge)

Not implemented (must not be guessed):

- non-UK → UK
- UK → non-UK
- goods
- live HMRC VAT-number validation
- GBP fiscal valuation / FX

When GBP valuation is unavailable, omit `tax_amount` and `taxable_amount`. Settlement USDC remains under `event.payment.settlement.asset`.

```json
{
  "jurisdiction": "GB",
  "regime": "uk-vat",
  "engine": "uk-vat",
  "ruleset_version": "uk-vat-2026.09",
  "status": "DETERMINED",
  "category": "standard_rate",
  "rate": { "numerator": "20", "denominator": "100" },
  "legal_reference": "Value Added Tax Act 1994; HMRC VAT Notice 700 — standard rate 20% from 4 January 2011",
  "extensions": {
    "uk-vat": {
      "customer_type": "B2C",
      "vat_format_valid": false,
      "statutory_invoice": false
    }
  }
}
```

## EU VAT

v2 can represent an EU determination. Production EU issuance **defaults to v1** until a separate migration decision. Do not silently convert live EU receipts to v2.
