# For coding agents

Load [skills/fiscal402/SKILL.md](../skills/fiscal402/SKILL.md) and https://www.fiscal402.com/llms.txt.

Fiscal402 is post-settlement fiscal evidence for settled x402 v2 exact USDC payments. It is not x402, not a facilitator, not a wallet, and not tax advice.

1. Check — POST https://api.fiscal402.com/v1/capabilities/check. Ingest only when DETERMINED_PRODUCTION, unless the user accepts review.
2. Ingest — POST https://api.fiscal402.com/settlements with documented PaymentEvidence, `X-Fiscal402-Key`, and `Idempotency-Key`. Never a raw tx hash. Never before settle.
3. Verify — `node packages/verify/dist/cli.js` after `npm install && npm run build`. Source-only. Not on npm.

VERIFIED means cryptographic integrity, not tax-authority acceptance.
