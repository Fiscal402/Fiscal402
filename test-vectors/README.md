# Test vectors

Sanitized, synthetic fixtures. No production transactions, merchants, or private keys.

| Path | Purpose |
|---|---|
| `canonical/golden-vector.json` | `fiscal402.sorted-json/1` digest regression |
| `valid/receipt.json` | signed v1 receipt |
| `valid/jwks.json` | public Ed25519 key only |
| `valid/invoice.xml` | UTF-8 artifact bound by `ubl_sha256` |
| `invalid/tampered-receipt.json` | payload mutated after signing |
| `invalid/tampered-ubl.xml` | artifact bytes that must not match |
| `invalid/unknown-jwks-key.json` | `key_id` not in JWKS |

Wallets and tx hashes in these files are **fixtures** (`0x` + repeating `ab` / `00`). They are not production activity.
