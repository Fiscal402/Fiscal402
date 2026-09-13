# @fiscal402/node

Server-side Node.js client for [Fiscal402](https://www.fiscal402.com). Turn machine payments into verifiable fiscal events.

This package wraps `@fiscal402/sdk`. It does not contain the tax engine. Merchant credentials are **server-side only**.

## Install

```bash
npm install @fiscal402/node
```

Requires Node.js 20.18 or later.

```ts
import { Fiscal402 } from "@fiscal402/node";

const fiscal402 = new Fiscal402({
  apiKey: process.env.FISCAL402_MERCHANT_KEY!,
});

const result = await fiscal402.processSettlement({
  amountUsdc: "1.00",
  txHash: "0xYOUR_SETTLED_TX",
  timestamp: "2026-09-10T12:00:00.000Z",
  payerWallet: "0xPAYER",
  receiverWallet: "0xPAY_TO",
  network: "eip155:1",
  consumerCountry: "DE",
  idempotencyKey: "acme-nl-de-1",
});
```

Set the merchant key on the server:

```bash
export FISCAL402_MERCHANT_KEY="f402m_your_key_here"
```

Never use `NEXT_PUBLIC_FISCAL402_KEY`, `VITE_FISCAL402_KEY`, or any browser-exposed env. Seller legal identity is bound to the Fiscal402 merchant account.

## Capabilities and receipts

```ts
const catalog = await fiscal402.getCapabilities();
const receipt = await fiscal402.getReceipt(result.id);
const jwks = await fiscal402.getJwks();
const report = await fiscal402.verifyReceipt({ receipt, jwks });
```

## Errors

```ts
import { Fiscal402, Fiscal402Error } from "@fiscal402/node";

try {
  await fiscal402.processSettlement({ /* ... */ });
} catch (error) {
  if (error instanceof Fiscal402Error) {
    // error.status, error.code, error.requestId
  }
}
```

## Coverage

EU VAT is the first production-grade jurisdiction engine. Fiscal402 does not claim worldwide tax support, automatic filing, or tax-authority approval.

Docs: https://www.fiscal402.com
