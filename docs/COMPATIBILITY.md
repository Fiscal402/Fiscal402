# Fiscal402-compatible

If a machine payment has settled, this is the portable object that can exist afterwards — whoever runs the tax engine.

x402 is the payment standard (HTTP 402 + settle). Fiscal402 Protocol is the post-settlement evidence standard. The company trading as Fiscal402 is the first production issuer and the first EU determination engine. It is not the only allowed issuer in the spec.

The spec allows multiple issuers; today one production issuer is listed.

A system is Fiscal402-compatible if it can do at least one of:

## A. Verify

- Accept `fiscal402.receipt/1.0.0`
- Canonicalize with `fiscal402.sorted-json/1`
- Check Ed25519 over the canonical payload hash
- Resolve `kid` via issuer JWKS
- If an artifact is bound, check sha256 of exact UTF-8 UBL 2.1 bytes
- Emit `VERIFIED` | `INVALID` | `UNKNOWN_KEY` | `ARTIFACT_MISMATCH` with the existing meanings

## B. Issue

- Emit `receipt/1.0.0` that passes the public v1 test vectors / schema
- Publish JWKS
- Bind settlement evidence + determination summary + artifact hashes as already specified
- Fail closed when a corridor is not production (no guessed rates)

## C. Consume

- Persist receipt + bound UBL hash
- Treat `VERIFIED` as integrity only
- Not treat the receipt as a VAT return

Compatible ≠ “uses api.fiscal402.com”.
Compatible ≠ “uses the company’s EU engine”.
The company’s engine is one conforming implementation.

Compatible does not mean endorsed by Fiscal402. The hosted API is not the spec.

## Frozen v1

`fiscal402.receipt/1.0.0` is frozen. No new required fields. Legal entity is out of band: JWKS + `kid`, plus [https://www.fiscal402.com/legal](https://www.fiscal402.com/legal) and `facts.json legal.*`.

## Minimal third-party path

```bash
git clone https://github.com/Fiscal402/Fiscal402.git
cd Fiscal402
npm install
npm run build
node packages/verify/dist/cli.js \
  test-vectors/valid/receipt.json \
  --jwks test-vectors/valid/jwks.json \
  --ubl test-vectors/valid/invoice.xml
```

No API key. Exit `0` = `VERIFIED`. Exit `1` = not verified. Exit `2` = invalid invocation.

## Links

- Protocol: https://www.fiscal402.com/protocol
- Receipt: https://www.fiscal402.com/protocol/receipt
- Implement a verifier: https://www.fiscal402.com/protocol/implement-verifier
- Schema: [schemas/fiscal402.receipt-1.0.0.schema.json](../schemas/fiscal402.receipt-1.0.0.schema.json)
- Test vectors: [test-vectors/](../test-vectors)
- Verifier: [packages/verify](../packages/verify)
- JWKS: https://api.fiscal402.com/.well-known/jwks.json
- Hosted product facts (not protocol): https://www.fiscal402.com/facts.json
