# Verify a receipt

The verifier is **not published to npm**. From the repository root:

```bash
npm install
npm run build
node packages/verify/dist/cli.js \
  test-vectors/valid/receipt.json \
  --jwks test-vectors/valid/jwks.json \
  --ubl test-vectors/valid/invoice.xml
```

Positional form:

```bash
node packages/verify/dist/cli.js \
  test-vectors/valid/receipt.json \
  test-vectors/valid/invoice.xml \
  test-vectors/valid/jwks.json
```

A `VERIFIED` outcome is cryptographic integrity only.
