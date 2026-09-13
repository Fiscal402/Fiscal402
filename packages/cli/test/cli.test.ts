import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { parseArgv } from "../src/parse.ts";
import { VERSION } from "@fiscal402/sdk";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const bin = join(root, "dist/cli.js");
const vectors = join(root, "../../test-vectors/valid");

describe("parseArgv", () => {
  it("parses help and version", () => {
    assert.equal(parseArgv(["--help"]).name, "help");
    assert.equal(parseArgv(["--version"]).name, "version");
  });

  it("parses capabilities check flags", () => {
    const cmd = parseArgv([
      "capabilities",
      "check",
      "--protocol",
      "x402",
      "--network",
      "eip155:1",
      "--json",
    ]);
    assert.equal(cmd.name, "capabilities-check");
    if (cmd.name === "capabilities-check") {
      assert.equal(cmd.protocol, "x402");
      assert.equal(cmd.network, "eip155:1");
      assert.equal(cmd.json, true);
    }
  });

  it("does not treat secrets as default args", () => {
    const cmd = parseArgv(["receipts", "verify", "receipt.json", "--jwks", "jwks.json"]);
    assert.equal(cmd.name, "receipts-verify");
    if (cmd.name === "receipts-verify") {
      assert.equal(cmd.receipt, "receipt.json");
      assert.equal(cmd.jwks, "jwks.json");
    }
  });
});

describe("cli binary", () => {
  it("prints the package version", () => {
    const result = spawnSync(process.execPath, [bin, "--version"], { encoding: "utf8" });
    assert.equal(result.status, 0);
    assert.equal(result.stdout.trim(), VERSION);
  });

  it("prints help", () => {
    const result = spawnSync(process.execPath, [bin, "--help"], { encoding: "utf8" });
    assert.equal(result.status, 0);
    assert.match(result.stdout, /fiscal402 --help/);
    assert.match(result.stdout, /FISCAL402_MERCHANT_KEY/);
  });

  it("verifies a local receipt vector", () => {
    const result = spawnSync(
      process.execPath,
      [
        bin,
        "receipts",
        "verify",
        join(vectors, "receipt.json"),
        "--ubl",
        join(vectors, "invoice.xml"),
        "--jwks",
        join(vectors, "jwks.json"),
        "--json",
      ],
      { encoding: "utf8" },
    );
    assert.equal(result.status, 0, result.stderr);
    const body = JSON.parse(result.stdout) as { verified: boolean; result: string };
    assert.equal(body.verified, true);
    assert.equal(body.result, "VERIFIED");
  });

  it("does not print a merchant key in diagnostics", () => {
    const result = spawnSync(process.execPath, [bin, "settlements", "get", "x", "--debug"], {
      encoding: "utf8",
      env: { ...process.env, FISCAL402_MERCHANT_KEY: "f402m_supersecretvalue99" },
    });
    const blob = `${result.stdout}${result.stderr}`;
    assert.equal(blob.includes("f402m_supersecretvalue99"), false);
  });
});
