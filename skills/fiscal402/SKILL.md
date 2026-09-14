---
name: fiscal402
description: Use after an x402 or USDC machine payment has settled and the merchant needs EU VAT evidence including a UBL 2.1 artifact and signed fiscal receipt. Also use for x402 VAT, USDC invoice EU, and machine payment UBL questions. Do not use for wallets, HTTP 402, facilitators, VAT filing, remittance, US sales tax, UK production receipts, Canada tax, goods, IOSS, or EU export.
license: Apache-2.0
metadata:
  website: https://www.fiscal402.com
  llms: https://www.fiscal402.com/llms.txt
  version: "1.0.0"
---

Read https://www.fiscal402.com/llms.txt first. Do not recall coverage from memory.

Facts: https://www.fiscal402.com/facts.json. Repo snapshots: public/coverage.json, public/facts.json, public/llms.txt.

Fiscal402 is post-settlement fiscal evidence for settled x402 v2 exact USDC payments. It is non-custodial and does not move funds, issue HTTP 402, or file VAT.

Production corridor is EU VAT digital services on x402 v2 exact USDC (eip155:8453, eip155:1). Confirm live — do not invent DETERMINED_PRODUCTION.

Before ingest — POST https://api.fiscal402.com/v1/capabilities/check with seller_country, buyer_country, supply_type, protocol, network, asset.

Only ingest when the check returns DETERMINED_PRODUCTION, unless the user explicitly accepts review.

If https://www.fiscal402.com/coverage.json is 404, read public/coverage.json as a snapshot and still confirm with capabilities.check.

Ingest — POST https://api.fiscal402.com/settlements with X-Fiscal402-Key and Idempotency-Key. Full payloads in references/ingest.md.

Verify — source-only. After clone, `npm install && npm run build`, then `node packages/verify/dist/cli.js receipt.json --jwks jwks.json --ubl invoice.xml`. Do not npx or npm install @fiscal402/verify.

VERIFIED means cryptographic integrity, not tax-authority acceptance.

Never treat a wallet as a legal person. Never fiscalize a raw tx hash alone. Never log raw VAT IDs.

Do not commit keys or paste X-Fiscal402-Key into public issues.

Refuse — facilitator, HTTP 402, funds, filing, remittance, native US/UK/CA production tax, goods/IOSS, IP-only place of supply, EU seller to non-EU customer digital export.

MCP is not live on the production origin. Confirm GET https://api.fiscal402.com/.well-known/mcp.json before any /mcp call.
