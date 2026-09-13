import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { Fiscal402Client, type Fiscal402Receipt, type Jwks } from "../dist/index.js";

const repo = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const validDir = join(repo, "test-vectors/valid");
const invalidDir = join(repo, "test-vectors/invalid");

function loadJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

describe("receipt verification uses protocol vectors", () => {
  const client = new Fiscal402Client();

  it("accepts the valid v1 receipt", async () => {
    const receipt = loadJson<Fiscal402Receipt>(join(validDir, "receipt.json"));
    const jwks = loadJson<Jwks>(join(validDir, "jwks.json"));
    const ubl = readFileSync(join(validDir, "invoice.xml"), "utf8");
    const report = await client.receipts.verify({ receipt, jwks, ubl });
    assert.equal(report.verified, true);
    assert.equal(report.result, "VERIFIED");
  });

  it("rejects a tampered payload", async () => {
    const receipt = loadJson<Fiscal402Receipt>(join(invalidDir, "tampered-receipt.json"));
    const jwks = loadJson<Jwks>(join(validDir, "jwks.json"));
    const report = await client.receipts.verify({ receipt, jwks });
    assert.equal(report.verified, false);
    assert.equal(report.result, "INVALID");
  });

  it("rejects an unknown signing key", async () => {
    const receipt = loadJson<Fiscal402Receipt>(join(invalidDir, "unknown-jwks-key.json"));
    const jwks = loadJson<Jwks>(join(validDir, "jwks.json"));
    const report = await client.receipts.verify({ receipt, jwks });
    assert.equal(report.verified, false);
    assert.ok(report.signing_key === "UNKNOWN_KEY_ID" || report.result === "INVALID");
  });
});
