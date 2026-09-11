# Signatures

`fiscal402.receipt` is signed with **Ed25519**. Unknown algorithms fail closed.

## v1 fields

```json
{
  "hashes": {
    "canonical_payload_sha256": "<64 lowercase hex>",
    "canonicalization": "fiscal402.sorted-json/1"
  },
  "signature": {
    "alg": "ed25519",
    "key_id": "receipt-ed25519-v1",
    "value": "<base64 Ed25519 signature>"
  }
}
```

## v2 fields

```json
{
  "integrity": {
    "canonicalization": "fiscal402.sorted-json/1",
    "payload_sha256": "<64 lowercase hex>"
  },
  "signature": {
    "alg": "ed25519",
    "key_id": "receipt-ed25519-v1",
    "value": "<base64 Ed25519 signature>"
  }
}
```

v2 uses `integrity` rather than `hashes` so the v1 object shape stays frozen.

## What is signed

The signature is over the **UTF-8 bytes of the hex digest string**, not over the raw 32-byte hash and not over the pretty-printed receipt JSON.

```
verify(Ed25519, message = utf8(payload_sha256), signature = base64decode(value), key = JWKS[key_id])
```

## Key identifier

`signature.key_id` selects a public key from JWKS.

Production issuers currently use `receipt-ed25519-v1` as the current key id. Historical keys may appear as `receipt-ed25519-prev-N`. This task does not rotate production keys.

## JWKS

Issuers publish public keys at:

```
GET /.well-known/jwks.json
```

Consumers may also pass a PEM directly. Missing or unknown `key_id` fails closed.
