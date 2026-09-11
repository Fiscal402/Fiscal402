# fiscal402.sorted-json/1

Public contract for:

- v1 `hashes.canonical_payload_sha256` on `fiscal402.receipt/1.0.0`
- v2 `integrity.payload_sha256` on `fiscal402.receipt/2.0.0`

This is a Fiscal402 convention. It is **not** RFC 8785, **not** JCS, and **not** an IANA standard.

## v2 decision

v2 **reuses** `fiscal402.sorted-json/1` rather than introducing a second algorithm.

The algorithm is already independently versioned, deterministic, UTF-8, and suitable for v2 because v2 money and rates are integer strings. A new algorithm would split verifiers without fixing a concrete bug. v1 behavior is unchanged.

## Encoding

- Character encoding: UTF-8
- Output: compact JSON (`JSON.stringify` after key-sort)
- No spaces after `:` or `,`
- No trailing newline
- No Unicode normalization of signed strings

## Object keys

- Recursively sort object keys with JavaScript `String` UTF-16 code unit order (`Object.keys(obj).sort()`)
- Omit keys whose value is `undefined`
- Keep `null`
- Duplicate keys are **invalid**. Producers MUST NOT emit them. Verifiers that see the original JSON text MUST reject them.

Protocol field names in v2 golden vectors are ASCII, so key order is unambiguous across languages that sort UTF-8 code points or UTF-16 code units.

## Arrays

- Preserve array order
- Recursively canonicalize each element

## Numbers

- JSON number serialization of IEEE-754 values as produced by JavaScript `JSON.stringify`
- Do not emit `NaN` or `Infinity` in receipts
- v1 monetary amounts are **decimal strings**; `rate_percent` is a JSON number
- v2 monetary amounts and rates are **integer strings**. v2 producers MUST NOT put money or rates in JSON numbers

## Timestamps

- v1: ISO-8601 strings already present on the record
- v2: RFC 3339 / ISO-8601 UTC with a `Z` suffix. Local timestamps are invalid
- Do not rewrite timezones during canonicalization

## Signed payload

### v1

Hash these fields (everything except `hashes` and `signature`).

### v2

Hash these fields (everything except `integrity` and `signature`, and except `hashes` if present).

Not signed as part of the payload (they bind the payload):

- v1: `hashes.*`, `signature.*`
- v2: `integrity.*`, `signature.*`

## Algorithm

```
unsigned = receipt without binding fields
canonical = fiscal402.sorted-json/1(unsigned)
payload_sha256 = SHA-256(UTF-8 bytes of canonical)
signature.value = Ed25519(UTF-8 bytes of the hex digest string)
```

The Ed25519 input is the **hex digest string**, not the raw 32-byte hash.

## Cross-language constraints

Do not rely on:

- JavaScript property insertion order (keys are sorted)
- `BigInt` JSON serialization
- `undefined`
- `Date` object behavior (timestamps are strings)
- floating-point tax arithmetic
- Node-specific implicit encodings

## Golden vectors

v1 input:

```json
{ "spec": "fiscal402.receipt", "spec_version": "1.0.0", "a": 1 }
```

```
b3217e8291e45ff4fabeb00f59ab8ec26bc3861555d48a7cb91a92db1251df4a
```

v2 input:

```json
{ "spec": "fiscal402.receipt", "spec_version": "2.0.0", "a": 1 }
```

```
ebcaf0dcddb4908ca6683847f8b2be9e0ce9c07399d4fc067e244505f3b1a3d4
```

See `test-vectors/canonical/golden-vector.json` and `test-vectors/v2/canonical/golden-vector.json`.
