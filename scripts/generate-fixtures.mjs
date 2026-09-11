#!/usr/bin/env node
/**
 * In-memory fixture generator. Private key never written to disk.
 */
import { generateKeyPairSync, sign } from "node:crypto";
import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

function sortValue(value) {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(sortValue);
  const out = {};
  for (const key of Object.keys(value).sort()) {
    const item = value[key];
    if (item === undefined) continue;
    out[key] = sortValue(item);
  }
  return out;
}
function stableStringify(value) {
  return JSON.stringify(sortValue(value));
}
function hashCanonicalPayload(unsignedBody) {
  return createHash("sha256").update(stableStringify(unsignedBody), "utf8").digest("hex");
}
function hashUblBytes(xml) {
  return createHash("sha256").update(xml, "utf8").digest("hex");
}

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const validDir = join(root, "test-vectors/valid");
const invalidDir = join(root, "test-vectors/invalid");
mkdirSync(validDir, { recursive: true });
mkdirSync(invalidDir, { recursive: true });

const pair = generateKeyPairSync("ed25519");
const publicPem = pair.publicKey.export({ type: "spki", format: "pem" }).toString();
const privatePem = pair.privateKey.export({ type: "pkcs8", format: "pem" }).toString();

const ubl = `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2">
  <cbc:ID xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">FIXTURE-20260911-1</cbc:ID>
  <cbc:Note xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">Synthetic Fiscal402 test vector. Not a live invoice.</cbc:Note>
</Invoice>
`;

const unsigned = {
  spec: "fiscal402.receipt",
  spec_version: "1.0.0",
  receipt_id: "rcpt_fixture_0001",
  mode: "sandbox",
  issued_at: "2026-09-11T00:00:00.000Z",
  protocol_version: "0.3.0",
  tax_ruleset_version: "eu-vat-oss-2026.09",
  settlement: {
    network: "eip155:8453",
    tx_hash: "0xabababababababababababababababababababababababababababababababab",
    amount_usdc: "1.00",
    asset: "USDC",
    payer: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    pay_to: "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    settled_at: "2026-09-10T12:00:00.000Z",
  },
  context: {
    payment: {
      network: "eip155:8453",
      tx_hash: "0xabababababababababababababababababababababababababababababababab",
      asset: "USDC",
      amount: "1.00",
      payer: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      pay_to: "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    },
    commercial: {
      customer_country: {
        value: "DE",
        source: "merchant_attested",
        evidence_ref: "event.consumerCountry",
        confidence: "attested",
      },
      customer_vat_id: {
        provided: false,
        source: "not_provided",
        evidence_ref: "none",
      },
      service: { value: "x402 paid resource", source: "system_default" },
    },
    fiscal: {
      seller_country: {
        value: "NL",
        source: "operator_configured",
        evidence_ref: "config.seller.country",
      },
      wallet_is_legal_identity: false,
      note: "A blockchain wallet is payment identity only. It does not prove a legal person.",
    },
  },
  determination: {
    regime: "OSS_B2C",
    tax_category: "S",
    rate_percent: 19,
    taxing_country: "DE",
    legal_reference: "EU One-Stop-Shop (OSS) — B2C digitale dienst: btw van de lidstaat van de afnemer (bestemmingsland)",
    provenance: {
      tax_ruleset_version: "eu-vat-oss-2026.09",
      regime_reason: "fixture",
      taxing_country_reason: "destination_member_state:DE",
      rate_reason: "19% category S under OSS_B2C",
      vat_id_evidence: "not_provided",
      location_confidence: "attested",
      location_source: "merchant_attested",
    },
  },
  fx: {
    eur_per_usdc: 0.86,
    as_of: "2026-09-10",
    source: "fixture",
    net_eur: "0.86",
    vat_eur: "0.16",
  },
  vies: {
    status: "NOT_PROVIDED",
    vat_id_hash: null,
  },
  artifacts: {
    settlement_id: "x402-fixture0001",
    ledger_id: "x402-fixture0001",
    ubl_sha256: hashUblBytes(ubl),
    ubl_hash_alg: "sha256-utf8-bytes",
  },
  disclaimer:
    "Technical classification artifact. Not tax advice, not a VAT return, and not a guarantee of tax-authority acceptance.",
};

const digest = hashCanonicalPayload(unsigned);
const value = sign(null, Buffer.from(digest), privatePem).toString("base64");
const receipt = {
  ...unsigned,
  hashes: {
    canonical_payload_sha256: digest,
    canonicalization: "fiscal402.sorted-json/1",
  },
  signature: {
    alg: "ed25519",
    key_id: "receipt-ed25519-v1",
    value,
  },
};

const jwks = {
  keys: [
    {
      kid: "receipt-ed25519-v1",
      kty: "OKP",
      crv: "Ed25519",
      use: "sig",
      pem: publicPem,
    },
  ],
};

writeFileSync(join(validDir, "receipt.json"), JSON.stringify(receipt, null, 2) + "\n");
writeFileSync(join(validDir, "jwks.json"), JSON.stringify(jwks, null, 2) + "\n");
writeFileSync(join(validDir, "invoice.xml"), ubl);


const tampered = structuredClone(receipt);
tampered.determination.rate_percent = 21;
writeFileSync(join(invalidDir, "tampered-receipt.json"), JSON.stringify(tampered, null, 2) + "\n");

writeFileSync(
  join(invalidDir, "tampered-ubl.xml"),
  ubl.replace("FIXTURE-20260911-1", "FIXTURE-TAMPERED"),
);

const unknown = structuredClone(receipt);
unknown.signature.key_id = "receipt-ed25519-unknown";
writeFileSync(join(invalidDir, "unknown-jwks-key.json"), JSON.stringify(unknown, null, 2) + "\n");


if (privatePem.includes("PRIVATE")) {
  // keep private key only in this process
}
console.log("fixtures written; private key discarded");
console.log("ubl_sha256", unsigned.artifacts.ubl_sha256);
console.log("payload", digest);
