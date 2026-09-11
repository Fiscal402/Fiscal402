import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import {
  hashCanonicalPayload,
  hashUblBytes,
  outcomeOf,
  parseReceipt,
  RECEIPT_CANONICALIZATION,
  RECEIPT_SPEC,
  RECEIPT_SPEC_VERSION,
  stableStringify,
  verifyArtifactHash,
  verifyFiscal402Receipt,
  verifyReceipt,
  type Fiscal402Receipt,
  type Jwks,
} from "../dist/index.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const vectors = join(root, "test-vectors");

function read(rel: string): string {
  return readFileSync(join(vectors, rel), "utf8");
}

describe("canonicalization golden vector", () => {
  it("matches the published digest regardless of key order", () => {
    const golden = JSON.parse(read("canonical/golden-vector.json")) as {
      canonical_payload_sha256: string;
      inputs: unknown[];
    };
    assert.equal(golden.canonical_payload_sha256, "b3217e8291e45ff4fabeb00f59ab8ec26bc3861555d48a7cb91a92db1251df4a");
    for (const input of golden.inputs) {
      assert.equal(hashCanonicalPayload(input), golden.canonical_payload_sha256);
    }
    const left = { spec: RECEIPT_SPEC, spec_version: RECEIPT_SPEC_VERSION, a: 1 };
    const right = { a: 1, spec_version: RECEIPT_SPEC_VERSION, spec: RECEIPT_SPEC };
    assert.equal(stableStringify(left), stableStringify(right));
  });
});

describe("valid receipt", () => {
  const receipt = parseReceipt(read("valid/receipt.json"));
  const jwks = JSON.parse(read("valid/jwks.json")) as Jwks;
  const ubl = read("valid/invoice.xml");

  it("schema identity is v1", () => {
    assert.equal(receipt.spec, RECEIPT_SPEC);
    assert.equal(receipt.spec_version, RECEIPT_SPEC_VERSION);
    assert.equal(receipt.hashes?.canonicalization, RECEIPT_CANONICALIZATION);
  });

  it("JSON Schema required fields are present", () => {
    const schema = JSON.parse(readFileSync(join(root, "schemas/fiscal402.receipt-1.0.0.schema.json"), "utf8")) as {
      required: string[];
    };
    for (const key of schema.required) {
      assert.equal(key in receipt, true, `missing ${key}`);
    }
  });

  it("signature and artifact verify", () => {
    const report = verifyReceipt({ receipt, jwks, ubl });
    assert.equal(report.verified, true);
    assert.equal(report.result, "VERIFIED");
    assert.equal(report.canonical_payload, "MATCH");
    assert.equal(report.signature, "VALID");
    assert.equal(report.signing_key, "JWKS_MATCH");
    assert.equal(report.ubl_sha256, "MATCH");
    assert.equal(report.legacy, false);
    assert.equal(outcomeOf(report), "VERIFIED");
    assert.equal(report.wallet_not_legal_identity, true);
  });

  it("verifyArtifactHash agrees with ubl_sha256", () => {
    const expected = receipt.artifacts?.ubl_sha256;
    assert.ok(expected);
    assert.equal(verifyArtifactHash(ubl, expected), true);
    assert.equal(hashUblBytes(ubl), expected);
  });
});

describe("invalid vectors", () => {
  const jwks = JSON.parse(read("valid/jwks.json")) as Jwks;
  const ubl = read("valid/invoice.xml");

  it("tampered receipt fails payload + signature", () => {
    const receipt = parseReceipt(read("invalid/tampered-receipt.json"));
    const report = verifyFiscal402Receipt(receipt, { jwks, ubl });
    assert.equal(report.verified, false);
    assert.equal(report.canonical_payload, "MISMATCH");
    assert.equal(outcomeOf(report), "INVALID");
  });

  it("tampered UBL is an artifact mismatch", () => {
    const receipt = parseReceipt(read("valid/receipt.json"));
    const bad = read("invalid/tampered-ubl.xml");
    const report = verifyFiscal402Receipt(receipt, { jwks, ubl: bad });
    assert.equal(report.verified, false);
    assert.equal(report.ubl_sha256, "MISMATCH");
    assert.equal(outcomeOf(report), "ARTIFACT_MISMATCH");
  });

  it("unknown JWKS key is reported", () => {
    const receipt = parseReceipt(read("invalid/unknown-jwks-key.json"));
    const report = verifyFiscal402Receipt(receipt, { jwks, ubl });
    assert.equal(report.verified, false);
    assert.equal(report.signing_key, "UNKNOWN_KEY_ID");
    assert.equal(outcomeOf(report), "UNKNOWN_KEY");
  });

  it("unsupported major version is not interpreted as v1", () => {
    const receipt = parseReceipt(read("valid/receipt.json"));
    const other = { ...receipt, spec_version: "2.0.0" } as Fiscal402Receipt;
    const report = verifyFiscal402Receipt(other, { jwks, ubl });
    assert.equal(report.receipt_schema, "UNSUPPORTED");
    assert.equal(outcomeOf(report), "UNSUPPORTED_VERSION");
    assert.equal(report.verified, false);
  });

  it("structural fixture missing spec fails schema", () => {
    const report = verifyFiscal402Receipt({ settlement: { network: "eip155:1", tx_hash: "0x00" } }, { jwks });
    assert.equal(report.receipt_schema, "MISSING");
    assert.equal(outcomeOf(report), "UNSUPPORTED_VERSION");
  });
});
