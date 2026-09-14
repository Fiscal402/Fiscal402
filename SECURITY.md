# Security

## Reporting a vulnerability

Do **not** open a public issue for secrets, private keys, or exploitable verification bugs.

Use [GitHub private vulnerability reporting](https://github.com/Fiscal402/Fiscal402/security/advisories/new) on this repository.

Contact: legal@fiscal402.com · hello@fiscal402.com · privacy@fiscal402.com

Do not send private keys, merchant keys, customer VAT IDs, or personal invoice data to public issues.

## Never submit

- private keys or PEMs marked PRIVATE
- `.env` files
- production ingest keys
- customer receipts with real identities
- database URLs, tokens, or passwords

## Verification scope

`@fiscal402/verify` checks cryptographic integrity of `fiscal402.receipt`.

A `VERIFIED` result is **not**:

- tax-authority acceptance
- legal advice
- a warranty that the determination is correct
- proof that a wallet is a legal person

## Signing keys

Issuers MUST keep receipt Ed25519 private keys offline from this repository.
Only public JWKS PEMs belong in fixtures.
