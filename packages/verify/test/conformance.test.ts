import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { outcomeOf, verifyReceipt, type Jwks } from "../dist/index.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");

describe("producer conformance: v1 still verifies", () => {
  it("published v1 vector is VERIFIED", () => {
    const receipt = readFileSync(join(root, "test-vectors/valid/receipt.json"), "utf8");
    const jwks = JSON.parse(readFileSync(join(root, "test-vectors/valid/jwks.json"), "utf8")) as Jwks;
    const ubl = readFileSync(join(root, "test-vectors/valid/invoice.xml"), "utf8");
    const report = verifyReceipt({ receipt, jwks, ubl });
    assert.equal(outcomeOf(report), "VERIFIED");
  });
});

describe("producer conformance: v2 UK vector is VERIFIED", () => {
  it("published v2 vector is VERIFIED", () => {
    const receipt = readFileSync(join(root, "test-vectors/v2/valid/receipt.json"), "utf8");
    const jwks = JSON.parse(readFileSync(join(root, "test-vectors/v2/valid/jwks.json"), "utf8")) as Jwks;
    const artifact = readFileSync(join(root, "test-vectors/v2/valid/uk-vat-determination.json"), "utf8");
    const report = verifyReceipt({
      receipt,
      jwks,
      artifacts: [{ id: "uk-vat-determination-1", bytes: artifact }],
    });
    assert.equal(outcomeOf(report), "VERIFIED");
  });
});
