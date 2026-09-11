#!/usr/bin/env node
/**
 * In-memory v2 fixture generator. Private key never written except as JWKS public PEM.
 */
import { createHash, generateKeyPairSync, sign } from "node:crypto";
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
function hashBytes(text) {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const validDir = join(root, "test-vectors/v2/valid");
const invalidDir = join(root, "test-vectors/v2/invalid");
const canonDir = join(root, "test-vectors/v2/canonical");
mkdirSync(validDir, { recursive: true });
mkdirSync(invalidDir, { recursive: true });
mkdirSync(canonDir, { recursive: true });

const pair = generateKeyPairSync("ed25519");
const publicPem = pair.publicKey.export({ type: "spki", format: "pem" }).toString();
const privatePem = pair.privateKey.export({ type: "pkcs8", format: "pem" }).toString();
const keyId = "receipt-ed25519-v1";

const ukArtifact = {
  spec: "fiscal402.uk-vat-determination",
  spec_version: "1.0.0",
  statutory_invoice: false,
  disclaimer:
    "Technical fiscal determination artifact. Not a substitute for a statutory VAT invoice. Not tax advice.",
  jurisdiction: "GB",
  regime: "uk-vat",
  engine: "uk-vat",
  ruleset_version: "uk-vat-2026.09",
  status: "DETERMINED",
  category: "standard_rate",
  rate: { numerator: "20", denominator: "100" },
  customer_type: "B2C",
  vat_format_valid: false,
  valuation: {
    status: "unavailable",
    reason: "gbp_valuation_not_supported",
    note: "Fiscal402 currently values USDC in EUR only. GBP taxable amount is not computed.",
  },
};
const artifactJson = `${JSON.stringify(ukArtifact, null, 2)}\n`;
const artifactHash = hashBytes(artifactJson);

const unsigned = {
  spec: "fiscal402.receipt",
  spec_version: "2.0.0",
  receipt_id: "rcpt_v2_uk_fixture_0001",
  issued_at: "2026-09-11T12:00:00.000Z",
  mode: "experimental",
  issuer: { id: "fiscal402", key_id: keyId },
  event: {
    id: "fiscal-uk-fixture-0001",
    occurred_at: "2026-09-10T12:00:00.000Z",
    payment: {
      protocol: { name: "evm-transfer", version: "1", scheme: "erc20-transfer" },
      settlement: {
        transaction_id: "0xabababababababababababababababababababababababababababababababab",
        network: { id: "eip155:1", namespace: "eip155" },
        rail: "evm-transfer",
        asset: { identifier: "USDC", amount_base_units: "2500000", decimals: 6 },
        payer: { kind: "wallet", identifier: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" },
        payee: { kind: "wallet", identifier: "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb" },
        settled_at: "2026-09-10T12:00:00.000Z",
      },
    },
    parties: {
      seller: { role: "seller", country: "GB", name: "UK Fixture Ltd" },
      buyer: { role: "buyer", country: "GB" },
    },
    supply: { kind: "digital_service", description: "Synthetic electronic service" },
  },
  determinations: [
    {
      jurisdiction: "GB",
      regime: "uk-vat",
      engine: "uk-vat",
      ruleset_version: "uk-vat-2026.09",
      status: "DETERMINED",
      category: "standard_rate",
      rate: { numerator: "20", denominator: "100" },
      legal_reference:
        "Value Added Tax Act 1994; HMRC VAT Notice 700 — standard rate 20% from 4 January 2011",
      provenance: [
        {
          authority: "HMRC / Value Added Tax Act 1994",
          source_url: "https://www.gov.uk/guidance/rates-of-vat-on-different-goods-and-services",
          retrieved_at: "2026-09-11",
          effective_from: "2011-01-04",
        },
      ],
      extensions: {
        "uk-vat": {
          customer_type: "B2C",
          vat_format_valid: false,
          statutory_invoice: false,
        },
      },
    },
  ],
  artifacts: [
    {
      id: "uk-vat-determination-1",
      type: "fiscal402.uk-vat-determination+json",
      media_type: "application/json",
      hash: { alg: "sha256", value: artifactHash },
      statutory_invoice: false,
    },
  ],
  disclaimer:
    "Technical classification artifact. Not tax advice, not a VAT return, and not a guarantee of tax-authority acceptance. Not a statutory UK VAT invoice.",
};

function attach(body) {
  const payloadHash = hashCanonicalPayload(body);
  const value = sign(null, Buffer.from(payloadHash), privatePem).toString("base64");
  return {
    ...body,
    integrity: {
      canonicalization: "fiscal402.sorted-json/1",
      payload_sha256: payloadHash,
    },
    signature: { alg: "ed25519", key_id: keyId, value },
  };
}

const receipt = attach(unsigned);
const jwks = {
  keys: [{ kid: keyId, kty: "OKP", crv: "Ed25519", use: "sig", pem: publicPem }],
};

writeFileSync(join(validDir, "receipt.json"), `${JSON.stringify(receipt, null, 2)}\n`);
writeFileSync(join(validDir, "jwks.json"), `${JSON.stringify(jwks, null, 2)}\n`);
writeFileSync(join(validDir, "uk-vat-determination.json"), artifactJson);

writeFileSync(
  join(canonDir, "golden-vector.json"),
  `${JSON.stringify(
    {
      canonicalization: "fiscal402.sorted-json/1",
      spec: "fiscal402.receipt",
      spec_version: "2.0.0",
      canonical_payload_sha256: "ebcaf0dcddb4908ca6683847f8b2be9e0ce9c07399d4fc067e244505f3b1a3d4",
      canonical_utf8: '{"a":1,"spec":"fiscal402.receipt","spec_version":"2.0.0"}',
      note: "Independent of the v1 golden digest. Key order must not matter.",
      inputs: [
        { spec: "fiscal402.receipt", spec_version: "2.0.0", a: 1 },
        { a: 1, spec_version: "2.0.0", spec: "fiscal402.receipt" },
      ],
    },
    null,
    2,
  )}\n`,
);

function writeInvalid(name, mutate) {
  const clone = JSON.parse(JSON.stringify(receipt));
  mutate(clone);
  writeFileSync(join(invalidDir, name), `${JSON.stringify(clone, null, 2)}\n`);
}

writeInvalid("tampered-payment.json", (r) => {
  r.event.payment.settlement.asset.amount_base_units = "9999999";
});
writeInvalid("tampered-determination.json", (r) => {
  r.determinations[0].rate.numerator = "5";
});
writeInvalid("tampered-artifact-hash.json", (r) => {
  r.artifacts[0].hash.value = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
});
writeInvalid("invalid-signature.json", (r) => {
  r.signature.value = Buffer.from("not-a-real-signature-bytes-here!!").toString("base64");
});
writeInvalid("unknown-key.json", (r) => {
  r.signature.key_id = "receipt-ed25519-unknown";
});
writeInvalid("unsupported-version.json", (r) => {
  r.spec_version = "3.0.0";
});
writeInvalid("malformed-money.json", (r) => {
  r.event.payment.settlement.asset.amount_base_units = "20.00";
});
writeInvalid("unknown-canonicalization.json", (r) => {
  r.integrity.canonicalization = "rfc8785";
});
writeInvalid("negative-amount.json", (r) => {
  r.event.payment.settlement.asset.amount_base_units = "-1";
});

writeFileSync(
  join(invalidDir, "duplicate-keys.json"),
  `{
  "spec": "fiscal402.receipt",
  "spec": "fiscal402.receipt",
  "spec_version": "2.0.0",
  "receipt_id": "dup"
}
`,
);

writeFileSync(
  join(root, "test-vectors/v2/README.md"),
  `# v2 test vectors

Synthetic UK VAT experimental receipt. Not a live transaction. Not a statutory invoice.

Valid:

- \`valid/receipt.json\`
- \`valid/jwks.json\`
- \`valid/uk-vat-determination.json\`

Golden canonicalization (independent of v1):

- \`canonical/golden-vector.json\`
- digest \`ebcaf0dcddb4908ca6683847f8b2be9e0ce9c07399d4fc067e244505f3b1a3d4\`

Invalid vectors are expected to fail closed.
`,
);

console.log("v2 payload_sha256", receipt.integrity.payload_sha256);
console.log("artifact sha256", artifactHash);
