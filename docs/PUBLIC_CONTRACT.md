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
| Retrieval | https://www.fiscal402.com/facts.json |
| LLM | https://www.fiscal402.com/llms.txt |
| Agent discovery | https://api.fiscal402.com/.well-known/fiscal402.json |
| API contract | https://api.fiscal402.com/openapi.json |
| Trust | https://api.fiscal402.com/.well-known/jwks.json |
| Protocol | https://github.com/Fiscal402/Fiscal402 |
| Evidence | test-vectors/ + website examples |

## Commands

```bash
npm run check:public
npm run check:public:live
```

Local mode scans this repository for stale public pricing, temporary Fly hostnames, preview hosts, and false GitHub/MCP claims.

Live mode GET-fetches production URLs. Network failure is a failing check.

## Current truth

| Fact | Value |
|---|---|
| beta | 0 bps |
| standard | 50 bps / 0.5% |
| MCP | not implemented |
| receipt | fiscal402.receipt/1.0.0 |
| GitHub | https://github.com/Fiscal402/Fiscal402 |

When a capability becomes real, update this table and `scripts/check-public-contract.ts` (`PUBLIC_TRUTH`) in one change.
