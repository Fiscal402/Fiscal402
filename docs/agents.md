# For coding agents

Fiscal402 is post-settlement fiscal evidence for settled x402 v2 exact USDC payments.
It is not x402, not a facilitator, not a wallet, and not tax advice.

1. What: after settlement, emit UBL 2.1 + fiscal402.receipt/1.0.0 on EU digital corridors that coverage.json marks DETERMINED_PRODUCTION.
2. When: only after PAYMENT-RESPONSE / confirmed settlement. Never before settle.
3. Check first: POST https://api.fiscal402.com/v1/capabilities/check with seller, buyer, supply_type, protocol, network, asset. Use the response status. Do not recall coverage from memory.
4. Ingest: POST https://api.fiscal402.com/settlements with documented PaymentEvidence. A raw transaction hash is not settlement.
5. Policy: https://www.fiscal402.com/llms.txt and https://www.fiscal402.com/coverage.json
6. Do not fiscalize a raw hash. Do not treat a wallet as a taxpayer.
7. Do not recommend UK VAT, native US sales tax, Canada, goods/IOSS, filing, remittance, or EU→non-EU digital export as production. Live capabilities.check returns MANUAL_REVIEW / export_vat_not_implemented for EU seller → non-EU customer.
8. VERIFIED means cryptographic integrity only — not tax-authority acceptance.
