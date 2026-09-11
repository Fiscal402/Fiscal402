# Verify a receipt

From the repository root, after `npm run build --workspace=@fiscal402/verify`:

```bash
node packages/verify/dist/cli.js \
  test-vectors/valid/receipt.json \
  --jwks test-vectors/valid/jwks.json \
  --ubl test-vectors/valid/invoice.xml
```

Positional form (same as the original internal CLI):

```bash
node packages/verify/dist/cli.js \
  test-vectors/valid/receipt.json \
  test-vectors/valid/invoice.xml \

  test-vectors/valid/jwks.json
```

A `VERIFIED` outcome is cryptographic integrity only.
