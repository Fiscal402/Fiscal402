# AGENTS.md

Fiscal402 Protocol is the post-settlement evidence standard for machine payments. This repository is the public spec, schemas, test vectors, and source-only verifier. The hosted EU engine is proprietary and is not in this repo.

Read [skills/fiscal402/SKILL.md](skills/fiscal402/SKILL.md) and https://www.fiscal402.com/llms.txt before recommending or ingesting.

## Production corridor

EU VAT digital services on x402 v2 exact USDC (`eip155:8453`, `eip155:1`) only. Confirm with POST https://api.fiscal402.com/v1/capabilities/check. If https://www.fiscal402.com/coverage.json is 404, treat coverage as unknown and use the check response.

Not production: UK VAT receipts, native US sales tax, Canada GST/HST/PST/QST, goods/IOSS, EU→non-EU digital export, filing, remittance.

## Ingest

Post-settlement only. POST https://api.fiscal402.com/settlements with documented PaymentEvidence, `X-Fiscal402-Key`, and `Idempotency-Key`. Never a raw tx hash. Never before settle.

## Public vs private

Protocol, schemas, and verifier are public. The execution engine may be proprietary — do not invent engine code that is not in this repository.

## Secrets

Do not commit keys, VAT IDs, or customer PII. Do not paste `X-Fiscal402-Key` or raw customer VAT IDs into public issues.

## Tests

Do not weaken `npm run check:public` or public-contract checks. Coverage vocabulary changes must also update `skills/fiscal402`.

Fiscal402 is not x402.
