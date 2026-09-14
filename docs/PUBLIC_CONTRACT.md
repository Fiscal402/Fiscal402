# Public contract

Fiscal402 has multiple public representations of the same facts.

```
ONE PUBLIC TRUTH
MANY REPRESENTATIONS
```

This repository is the protocol surface. The checker keeps it honest against the live website and API.

## Surface map

| Surface | URL |
|---|---|
| Human | https://www.fiscal402.com |
| Legal | https://www.fiscal402.com/legal |
| Pricing | https://www.fiscal402.com/pricing |
| Retrieval | https://www.fiscal402.com/facts.json |
| LLM | https://www.fiscal402.com/llms.txt |
| Agent discovery | https://api.fiscal402.com/.well-known/fiscal402.json |
| API capabilities | https://api.fiscal402.com/v1/capabilities |
| API contract | https://api.fiscal402.com/openapi.json |
| Trust | https://api.fiscal402.com/.well-known/jwks.json |
| Protocol | https://github.com/Fiscal402/Fiscal402 |
| Evidence | test-vectors/ + website examples |

## Commands

```bash
npm run check:public
npm run check:public:live
```

Local mode scans this repository for stale public pricing, temporary Fly hostnames, preview hosts, and false GitHub claims.

Live mode GET-fetches production URLs. Network failure is a failing check. CI runs local on push/PR and live on a daily schedule.

## Current truth

| Fact | Value |
|---|---|
| beta | `pricing_beta.fee_bps === 0` |
| standard | `pricing_standard.fee_bps === 10` (0.1% of fiscalized volume) |
| high volume | custom contracted |
| MCP | implemented (JSON-RPC /mcp) |
| receipt | fiscal402.receipt/1.0.0 |
| GitHub | https://github.com/Fiscal402/Fiscal402 |
| legal.trade_name | Fiscal402 |
| legal.statutory_name | present and not a placeholder (FAIL until KvK registration) |
| production jurisdictions | EU VAT only |
| UK / US / Canada | not production |
| npm/PyPI verifier | not_implemented |
| named ERP adapters | not_implemented |

When a capability becomes real, update this table and `scripts/check-public-contract.ts` (`PUBLIC_TRUTH`) in one change.

Live equality checks:

- `pricing_standard.fee_bps === 10`
- `pricing_beta.fee_bps === 0`
- `legal.statutory_name` present and not a placeholder
- `legal.trade_name === "Fiscal402"`
- production jurisdiction list includes EU VAT only as production
- capability_matrix statuses: UK/US/Canada/receipt v2/npm/PyPI/ERP are not `production`
- llms.txt pricing lines include `0 bps`, `10 bps`, `0.1%`
- `/pricing` page numbers match 10 bps / 0.1%
- API `/v1/capabilities` includes EU VAT
- “Fiscal402 is not x402”
- no leftover `50 bps` / `0.5%`

Denied in public output: `0.01 USDC`, `x402-lhrtxg.fly.dev`, `grok.me`, `github: false`, `50 bps`, `0.5%`.

Fiscal402 is not x402. Fiscal402 is not a tax authority or filing product. Do not invent KvK/VAT numbers to make the checker pass.
