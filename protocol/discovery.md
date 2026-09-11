# Discovery

Fiscal402 issuers may publish a well-known document. This is a **Fiscal402 convention**, not an IANA-registered well-known suffix.

## Endpoints implemented by current issuers

| Path | Purpose |
|---|---|
| `/.well-known/fiscal402.json` | issuer manifest |
| `/.well-known/jwks.json` | Ed25519 public keys for receipt verification |
| `/.well-known/agent-card.json` | agent-oriented description (issuer-specific) |

A verifier only **needs** the JWKS (or an equivalent PEM) plus the receipt and optional artifact.

## Manifest (`fiscal402.well-known`)

Current production manifests include:

- `spec`: `fiscal402.well-known`
- `protocol_version`
- `tax_ruleset_version`
- `capabilities` (issuer-specific; not a global registry)
- `endpoints.jwks`, `endpoints.receipt`
- `security.receipt_signature`: `ed25519`
- `legal.is` / `legal.not` (technical classification; not tax advice)

Do not treat a capability string as proof that a second rail or jurisdiction is live.

## JWKS

See [signatures.md](./signatures.md). Public keys only.

## What discovery is not

- Not a tax-authority register
- Not a guarantee the issuer's determination is correct
- Not an IANA standard
