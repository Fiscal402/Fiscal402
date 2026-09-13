# @fiscal402/cli

Command-line interface for [Fiscal402](https://www.fiscal402.com).

```bash
npm install -g @fiscal402/cli
fiscal402 --help
```

or:

```bash
npx @fiscal402/cli capabilities
npx @fiscal402/cli --version
```

Requires Node.js 20.18 or later.

## Commands

```text
fiscal402 --help
fiscal402 --version
fiscal402 capabilities
fiscal402 capabilities check --protocol x402 --network eip155:1 --asset USDC --json
fiscal402 receipts verify receipt.json --ubl invoice.xml --jwks jwks.json
fiscal402 receipts get <id>
fiscal402 settlements get <id>
fiscal402 settlements create --file body.json
```

`--json` prints machine-readable output. `--debug` prints diagnostics with secrets redacted.

## Credentials

Authenticated commands read the merchant key from the environment. Do not pass secrets as CLI arguments.

```bash
export FISCAL402_MERCHANT_KEY="f402m_your_key_here"
export FISCAL402_ORIGIN="https://api.fiscal402.com"
```

Merchant keys are server-side credentials. Never put them in `NEXT_PUBLIC_*`, `VITE_*`, or browser code.

Public commands (`capabilities`, `jwks`, local `receipts verify`) do not require a key.

## Exit codes

- `0` success
- `1` request or verification failure
- `2` invalid invocation

## Coverage

EU VAT is the first production-grade jurisdiction engine. Fiscal402 does not claim worldwide tax support, automatic filing, or tax-authority approval.
