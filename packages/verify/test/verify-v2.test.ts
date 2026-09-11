import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import {
  hashCanonicalPayload,
  outcomeOf,
  parseReceipt,
  RECEIPT_CANONICALIZATION,
  RECEIPT_SPEC,
  RECEIPT_SPEC_VERSION,
  RECEIPT_SPEC_VERSION_V2,
  ReceiptParseError,
  verifyFiscal402Receipt,
  verifyReceipt,
  type Jwks,
} from "../dist/index.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const vectors = join(root, "test-vectors/v2");

function read(rel: string): string {
  return readFileSync(join(vectors, rel), "utf8");
}

describe("v2 canonicalization golden vector", () => {
  it("matches the published digest regardless of key order", () => {
    const golden = JSON.parse(read("canonical/golden-vector.json")) as {
      canonical_payload_sha256: string;
      inputs: unknown[];
    };
    assert.equal(golden.canonical_payload_sha256, "ebcaf0dcddb4908ca6683847f8b2be9e0ce9c07399d4fc067e244505f3b1a3d4");
    for (const input of golden.inputs) {
      assert.equal(hashCanonicalPayload(input), golden.canonical_payload_sha256);
    }
    assert.notEqual(
      golden.canonical_payload_sha256,
      "b3217e8291e45ff4fabeb00f59ab8ec26bc3861555d48a7cb91a92db1251df4a",
    );
  });
});

describe("valid UK v2 receipt", () => {
  const raw = read("valid/receipt.json");
  const receipt = parseReceipt(raw);
  const jwks = JSON.parse(read("valid/jwks.json")) as Jwks;
  const artifact = read("valid/uk-vat-determination.json");

  it("schema identity is v2", () => {
    assert.equal(receipt.spec, RECEIPT_SPEC);
    assert.equal(receipt.spec_version, RECEIPT_SPEC_VERSION_V2);
    assert.equal((receipt.integrity as { canonicalization: string }).canonicalization, RECEIPT_CANONICALIZATION);
  });

  it("has no v1-shaped top-level fields", () => {
    assert.equal("amount_usdc" in receipt, false);
    assert.equal("vies" in receipt, false);
    assert.equal("settlement" in receipt, false);
    assert.equal(Array.isArray(receipt.artifacts), true);
    assert.equal(Array.isArray(receipt.determinations), true);
  });

  it("verifies with JWKS and technical artifact", () => {
    const report = verifyReceipt({
      receipt: raw,
      jwks,
      artifacts: [{ id: "uk-vat-determination-1", bytes: artifact }],
    });
    assert.equal(report.verified, true);
    assert.equal(report.result, "VERIFIED");
    assert.equal(report.canonical_payload, "MATCH");
    assert.equal(report.signature, "VALID");
    assert.equal(report.signing_key, "JWKS_MATCH");
    assert.equal(report.artifacts, "MATCH");
    assert.equal(outcomeOf(report), "VERIFIED");
  });

  it("v1 verifier does not interpret v2 as v1", () => {
    const report = verifyFiscal402Receipt(receipt, { jwks });
    assert.equal(report.receipt_schema, "UNSUPPORTED");
    assert.equal(outcomeOf(report), "UNSUPPORTED_VERSION");
    assert.equal(report.verified, false);
  });
});

describe("invalid v2 vectors", () => {
  const jwks = JSON.parse(read("valid/jwks.json")) as Jwks;
  const artifact = read("valid/uk-vat-determination.json");

  it("tampered payment amount fails", () => {
    const report = verifyReceipt({ receipt: read("invalid/tampered-payment.json"), jwks });
    assert.equal(report.verified, false);
    assert.equal(report.canonical_payload, "MISMATCH");
    assert.equal(outcomeOf(report), "INVALID");
  });

  it("tampered determination fails", () => {
    const report = verifyReceipt({ receipt: read("invalid/tampered-determination.json"), jwks });
    assert.equal(report.canonical_payload, "MISMATCH");
    assert.equal(report.verified, false);
  });

  it("tampered artifact hash fails when bytes supplied", () => {
    const report = verifyReceipt({
      receipt: read("invalid/tampered-artifact-hash.json"),
      jwks,
      artifacts: [{ id: "uk-vat-determination-1", bytes: artifact }],
    });
    assert.equal(report.artifacts, "MISMATCH");
    assert.equal(outcomeOf(report), "ARTIFACT_MISMATCH");
  });

  it("invalid signature fails", () => {
    const report = verifyReceipt({ receipt: read("invalid/invalid-signature.json"), jwks });
    assert.equal(report.signature, "INVALID");
    assert.equal(report.verified, false);
  });

  it("unknown key fails", () => {
    const report = verifyReceipt({ receipt: read("invalid/unknown-key.json"), jwks });
    assert.equal(report.signing_key, "UNKNOWN_KEY_ID");
    assert.equal(outcomeOf(report), "UNKNOWN_KEY");
  });

  it("unsupported v2+ version is not interpreted", () => {
    const report = verifyReceipt({ receipt: read("invalid/unsupported-version.json"), jwks });
    assert.equal(report.receipt_schema, "UNSUPPORTED");
    assert.equal(outcomeOf(report), "UNSUPPORTED_VERSION");
  });

  it("malformed monetary integer fails", () => {
    const report = verifyReceipt({ receipt: read("invalid/malformed-money.json"), jwks });
    assert.equal(report.verified, false);
    assert.ok(report.notes.some((n) => /malformed monetary integer/.test(n)));
  });

  it("unknown canonicalization fails closed", () => {
    const report = verifyReceipt({ receipt: read("invalid/unknown-canonicalization.json"), jwks });
    assert.equal(report.verified, false);
    assert.ok(report.notes.some((n) => /unknown canonicalization/.test(n)));
  });

  it("negative amount fails", () => {
    const report = verifyReceipt({ receipt: read("invalid/negative-amount.json"), jwks });
    assert.equal(report.verified, false);
  });

  it("duplicate JSON keys fail closed", () => {
    assert.throws(() => parseReceipt(read("invalid/duplicate-keys.json")), ReceiptParseError);
    const report = verifyReceipt({ receipt: read("invalid/duplicate-keys.json"), jwks });
    assert.equal(report.verified, false);
    assert.ok(report.notes.some((n) => /DUPLICATE_KEYS/.test(n)));
  });
});

describe("v1 callers remain on v1", () => {
  it("existing v1 identity constants are unchanged", () => {
    assert.equal(RECEIPT_SPEC_VERSION, "1.0.0");
    assert.equal(RECEIPT_SPEC_VERSION_V2, "2.0.0");
  });
});
