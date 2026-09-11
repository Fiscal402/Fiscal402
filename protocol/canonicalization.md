# fiscal402.sorted-json/1

Public contract for `hashes.canonical_payload_sha256` on `fiscal402.receipt/1.0.0`.

This is a Fiscal402 convention. It is **not** RFC 8785, **not** JCS, and **not** an IANA standard.

## Encoding

- Character encoding: UTF-8
- Output: compact JSON (`JSON.stringify` after key-sort)
- No spaces after `:` or `,`
- No trailing newline

## Object keys

- Recursively sort object keys with JavaScript `String` UTF-16 code unit order (`Object.keys(obj).sort()`)
- Omit keys whose value is `undefined`
- Keep `null`

## Arrays

- Preserve array order
- Recursively canonicalize each element

## Numbers

- JSON number serialization of IEEE-754 values as produced by JavaScript `JSON.stringify`
- Do not emit `NaN` or `Infinity` in receipts
- Monetary amounts on the receipt are **decimal strings** (`"1.00"`, `"0.86"`), not floats
- `rate_percent` is a JSON number (for example `19`)

## Timestamps

- ISO-8601 strings already present on the record (`issued_at`, `settled_at`, `fx.as_of`)
- Do not rewrite timezones during canonicalization

## Signed payload

Hash these fields (everything except `hashes` and `signature`):

- `spec`, `spec_version`, `receipt_id`, `mode`, `issued_at`
- `protocol_version`, `tax_ruleset_version`
- `settlement`, `context`, `determination`, `fx`, `vies`, `artifacts`, `disclaimer`

Not signed as part of the payload (they bind the payload):

- `hashes.canonical_payload_sha256`
- `hashes.canonicalization`
- `signature.alg`
- `signature.key_id`
- `signature.value`

## Algorithm

```
unsigned = receipt without hashes and signature
canonical = fiscal402.sorted-json/1(unsigned)
hashes.canonical_payload_sha256 = SHA-256(UTF-8 bytes of canonical)
signature.value = Ed25519(UTF-8 bytes of the hex digest string)
```

The Ed25519 input is the **hex digest string**, not the raw 32-byte hash.

## Golden vector

Input (key order must not matter):

```json
{ "spec": "fiscal402.receipt", "spec_version": "1.0.0", "a": 1 }
```

`hashes.canonical_payload_sha256`:

```
b3217e8291e45ff4fabeb00f59ab8ec26bc3861555d48a7cb91a92db1251df4a
```

See `test-vectors/canonical/golden-vector.json`.
