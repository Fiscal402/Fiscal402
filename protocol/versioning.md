# Versioning

These versions are independent:

| Axis | Example | What it versions |
|---|---|---|
| Protocol (backend) | `0.3.0` | Fiscal402 service/API |
| Receipt spec | `1.0.0` | `fiscal402.receipt` document |
| Canonicalization | `fiscal402.sorted-json/1` | payload hash algorithm |
| Payment protocol | `x402` v2 `exact` | how money moved |
| Tax ruleset | `eu-vat-oss-2026.09` | determination rules used by the issuer |

A consumer verifying a receipt cares about **receipt spec + canonicalization**, not about the issuer's backend version.

## Receipt v1 rules

- Breaking signed-field changes require a new **major** receipt version (`2.0.0`).
- Old `1.0.0` receipts remain verifiable with this tooling.
- Canonicalization is versioned separately (`fiscal402.sorted-json/1`).
- Unknown major versions MUST NOT be interpreted as v1. The verifier reports `UNSUPPORTED`.

## Receipt v2

Not specified. Receipt v2 should be driven by a real second payment rail or a real second jurisdiction, not by cleanup of v1 field names.

v1 fields such as `amount_usdc`, `vies`, and `x402-…` identifiers are known compatibility debt. They stay.

## Unknown documents

If `spec` is missing or not `fiscal402.receipt`, or `spec_version` is not `1.0.0`, verification MUST fail closed (`UNSUPPORTED_VERSION` / `INVALID`). Do not guess.
