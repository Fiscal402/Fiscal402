# Versioning

These versions are independent:

| Axis | Example | What it versions |
|---|---|---|
| Protocol (backend) | `0.3.0` | Fiscal402 service/API |
| Receipt spec | `1.0.0`, `2.0.0` | `fiscal402.receipt` document |
| Canonicalization | `fiscal402.sorted-json/1` | payload hash algorithm |
| Payment protocol | `x402` v2 `exact` | how money moved |
| Tax ruleset | `eu-vat-oss-2026.09`, `uk-vat-2026.09` | determination rules used by the issuer |
| Artifact format | UBL 2.1, `fiscal402.uk-vat-determination+json` | bound bytes, not the receipt spec |
| Jurisdiction engine | `eu-vat`, `uk-vat` | producer implementation |

A consumer verifying a receipt cares about **receipt spec + canonicalization**, not about the issuer's backend version.

Receipt version is independent from payment protocol version, tax ruleset version, jurisdiction engine version, canonicalization version, and artifact format version.

## Receipt v1 rules

- v1 is **frozen**. It is not deprecated.
- Breaking signed-field changes require a new **major** receipt version.
- Old `1.0.0` receipts remain verifiable with this tooling.
- Canonicalization is versioned separately (`fiscal402.sorted-json/1`).
- Unknown major versions MUST NOT be interpreted as v1.

v1 fields such as `amount_usdc`, `vies`, and `x402-…` identifiers are known compatibility debt. They stay.

## Receipt v2 rules

- v2 is the generic multi-rail / multi-jurisdiction format.
- v2 reuses `fiscal402.sorted-json/1` (independently versioned).
- v2 is **EXPERIMENTAL** until a real external transaction has been issued and independently verified.
- Consumers add v2 support independently. There is **no** migration requirement for v1 consumers.
- Production EU x402 issuance remains v1 until a separate deliberate default-migration decision.

See [receipt-2.0.md](./receipt-2.0.md).

## Consumer compatibility

| Document | Action |
|---|---|
| `spec_version` `1.0.0` | Verify with the v1 verifier |
| `spec_version` `2.0.0` | Verify with the v2 verifier |
| unknown version | `UNSUPPORTED_VERSION` / `INVALID`. Do not partially interpret. |
| missing `spec` | `UNSUPPORTED_VERSION` / `INVALID` |

`parseReceipt` / `verifyReceipt` dispatch on `spec_version`. `verifyFiscal402Receipt` remains the v1 function and will report v2 documents as `UNSUPPORTED`.

## Unknown documents

If `spec` is missing or not `fiscal402.receipt`, verification MUST fail closed. Do not guess.
