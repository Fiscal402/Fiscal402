# @fiscal402/sdk

Typed client for [Fiscal402](https://www.fiscal402.com) — fiscal infrastructure for autonomous commerce. Turn machine payments into verifiable fiscal events. EU VAT is the first production-grade jurisdiction engine.

This package talks to `https://api.fiscal402.com`. It does not contain the tax engine, does not invent tax results, and does not custody funds.

## Install

```bash
npm install @fiscal402/sdk
```

Requires Node.js 20.18 or later.

## Server-side credentials

Merchant keys (`f402m_...`) are **server-side credentials**. Send them as `X-Fiscal402-Key`.

```bash
export FISCAL402_MERCHANT_KEY="f402m_your_key_here"
```

Do **not** put the key in `NEXT_PUBLIC_*`, `VITE_*`, `PUBLIC_*`, browser bundles, or client-side requests.

## Initialize

```ts
import { Fiscal402Client } from "@fiscal402/sdk";

const client = new Fiscal402Client({
  apiKey: process.env.FISCAL402_MERCHANT_KEY!,
  baseUrl: "https://api.fiscal402.com",
});
```

Public discovery (`capabilities`, JWKS, local receipt verify) works without a key.

## Settlements (production x402 ingest)

`POST /settlements` is the production ingest path. Seller legal identity is bound to the merchant account, not sent per transaction.

```ts
const record = await client.settlements.create({
  amountUsdc: "1.00",
  txHash: "0xYOUR_SETTLED_TX",
  timestamp: "2026-09-10T12:00:00.000Z",
  payerWallet: "0xPAYER",
  receiverWallet: "0xPAY_TO",
  network: "eip155:1",
  asset: "USDC",
  scheme: "exact",
  consumerCountry: "DE",
  idempotencyKey: "acme-nl-de-1",
});
```

A raw transaction hash is not enough.

## Capabilities

```ts
const catalog = await client.capabilities.get();
const check = await client.capabilities.check({
  protocol: "x402",
  network: "eip155:1",
  asset: "USDC",
  seller_country: "NL",
  buyer_country: "DE",
  supply_type: "digital_service",
});
```

## Receipt verification

```ts
const receipt = await client.receipts.get(record.id);
const jwks = await client.jwks.get();
const report = await client.receipts.verify({ receipt, jwks });
// report.verified means cryptographic integrity, not tax-authority acceptance.
```

## Errors

```ts
import { Fiscal402Error } from "@fiscal402/sdk";

try {
  await client.settlements.get("missing");
} catch (error) {
  if (error instanceof Fiscal402Error) {
    console.error(error.status, error.code, error.requestId);
  }
}
```

GET requests retry conservatively on 429/5xx. POST is never retried automatically.

## Coverage

EU VAT is the first production-grade jurisdiction engine. Other jurisdictions may return `MANUAL_REVIEW` or `UNSUPPORTED`. Fiscal402 does not claim worldwide tax support, automatic filing, or tax-authority approval.

## Docs

- Website: https://www.fiscal402.com
- Protocol: https://github.com/Fiscal402/Fiscal402
- API: https://api.fiscal402.com/openapi.json
