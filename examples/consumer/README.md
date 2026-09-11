# Consumer example

Pretend you are an ERP / agent / marketplace. You receive:

- a `fiscal402.receipt`
- the issuer JWKS
- the bound UBL bytes

You verify, then keep a generic downstream JSON. You do not import Fiscal402's tax engine.

```bash
npm run example:consumer
```
