# Contributing

This repository is the **public protocol and verifier**. It is not the Fiscal402 execution engine.

Useful contributions:

- spec clarity
- verifier interoperability
- test vectors (sanitized only)
- JSON Schema correctness
- consumer examples and integrations

Not in scope here:

- VAT / OSS / reverse-charge rule changes
- VIES orchestration
- FX sources
- settlement ingest
- billing

Proprietary jurisdiction engines are not modified from this repository.

## Tests

```bash
npm test
npm run typecheck
npm run build
```

## Fixtures

Public fixtures MUST be synthetic. No real merchants, customers, production tx hashes, or private keys.
