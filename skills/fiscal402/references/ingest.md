# Full payloads

Copied from https://www.fiscal402.com/docs/getting-started. Placeholders only.

## Capabilities check

```http
POST https://api.fiscal402.com/v1/capabilities/check
Content-Type: application/json

{
  "seller_country": "NL",
  "buyer_country": "DE",
  "supply_type": "digital_service",
  "buyer_type": "B2C",
  "payment": {
    "protocol": "x402",
    "network": "eip155:8453",
    "asset": "USDC"
  }
}
```

Ingest only when the response is DETERMINED_PRODUCTION, unless the user explicitly accepts review.

## Settlements ingest

```bash
export FISCAL402_ORIGIN="https://api.fiscal402.com"
export FISCAL402_MERCHANT_KEY="f402m_your_key_here"

curl -sS -X POST "$FISCAL402_ORIGIN/settlements" \
  -H "Content-Type: application/json" \
  -H "X-Fiscal402-Key: $FISCAL402_MERCHANT_KEY" \
  -H "Idempotency-Key: acme-nl-de-1" \
  -d '{
    "amountUsdc": "1.00",
    "txHash": "0xYOUR_SETTLED_TX",
    "timestamp": "2026-09-10T12:00:00.000Z",
    "payerWallet": "0xPAYER",
    "receiverWallet": "0xPAY_TO",
    "network": "eip155:1",
    "asset": "USDC",
    "scheme": "exact",
    "consumerCountry": "DE",
    "consumerName": "Buyer GmbH"
  }'
```

A raw transaction hash is not settlement. Do not send `X-Fiscal402-Key` or raw VAT IDs to public issues.
