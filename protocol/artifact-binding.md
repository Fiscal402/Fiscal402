# Artifact binding

`fiscal402.receipt/1.0.0` binds a UBL 2.1 invoice by hashing **exact UTF-8 bytes**.

```json
{
  "artifacts": {
    "settlement_id": "x402-…",
    "ledger_id": "x402-…",
    "ubl_sha256": "<64 lowercase hex>",
    "ubl_hash_alg": "sha256-utf8-bytes"
  }
}
```

## Algorithm

```
artifacts.ubl_sha256 = SHA-256(UTF-8 bytes of the UBL document as issued)
artifacts.ubl_hash_alg = "sha256-utf8-bytes"
```

There is **no XML Canonicalization (C14N)**. Re-serializing equivalent XML with different whitespace, attribute order, or self-closing tags is a **different** artifact and MUST fail the hash check.

## What the verifier does

If the caller supplies UBL bytes and the receipt has `artifacts.ubl_sha256`:

- `MATCH` — SHA-256 of those bytes equals the receipt field
- `MISMATCH` — bytes differ

If the caller does not supply UBL bytes, the verifier reports `NOT_PROVIDED` and does **not** fail the receipt for that reason.

## Settlement / ledger ids

On current production receipts these ids are `x402-` prefixed hashes of the settlement. That prefix is receipt-v1 compatibility, not a requirement that every future rail use it.

## What is not bound

The verifier does not fetch chain state, does not re-run VAT classification, and does not re-quote FX. Those belong to execution, not to this hash.
