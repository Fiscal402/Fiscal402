# Signatures

`fiscal402.receipt/1.0.0` is signed with **Ed25519**.

## Fields

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

## What is signed

The signature is over the **UTF-8 bytes of the hex digest string** in `hashes.canonical_payload_sha256`, not over the raw 32-byte hash and not over the pretty-printed receipt JSON.

```
verify(Ed25519, message = utf8(canonical_payload_sha256), signature = base64decode(value), key = JWKS[key_id])
```

## Key identifier

`signature.key_id` selects a public key from JWKS.

Production issuers currently use `receipt-ed25519-v1` as the current key id. Historical keys may appear as `receipt-ed25519-prev-N`.

## JWKS

Issuers publish public keys at:

```
GET /.well-known/jwks.json
```

Current production JWKS entries include:

```json
{
  "keys": [
    {
      "kid": "receipt-ed25519-v1",
      "kty": "OKP",
      "crv": "Ed25519",
      "use": "sig",
      "pem": "-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----\n"
    }
  ]
}
```

The verifier in this repository looks up `kid` and uses the `pem` field (SPKI PEM). It does not require `x` (raw OKP) on v1.

**Never** distribute private keys. Public test vectors in this repository contain only public PEMs.

## Verification process

1. Confirm `spec` / `spec_version`.
2. Drop `hashes` and `signature`; recompute `fiscal402.sorted-json/1`; compare SHA-256 hex to `hashes.canonical_payload_sha256`.
3. Resolve `signature.key_id` in JWKS.
4. Verify Ed25519 over the hex digest string.
5. Optionally hash supplied artifact bytes and compare to `artifacts.ubl_sha256`.

If `hashes.canonicalization` is missing or not `fiscal402.sorted-json/1`, a stored-hash-only check is **legacy**. Tools MUST report `legacy: true` and MUST NOT claim the payload was reproduced with `fiscal402.sorted-json/1`.
