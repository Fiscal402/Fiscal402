# v2 test vectors

Synthetic UK VAT experimental receipt. Not a live transaction. Not a statutory invoice.

Valid:

- `valid/receipt.json`
- `valid/jwks.json`
- `valid/uk-vat-determination.json`

Golden canonicalization (independent of v1):

- `canonical/golden-vector.json`
- digest `ebcaf0dcddb4908ca6683847f8b2be9e0ce9c07399d4fc067e244505f3b1a3d4`

Invalid vectors are expected to fail closed.
