import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { maskMerchantKey, redactSecrets, resolveMerchantKey, VERSION } from "../dist/index.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

describe("merchant key resolution", () => {
  it("prefers FISCAL402_MERCHANT_KEY", () => {
    const prev = process.env.FISCAL402_MERCHANT_KEY;
    const prevKey = process.env.FISCAL402_KEY;
    process.env.FISCAL402_MERCHANT_KEY = "f402m_merchant";
    process.env.FISCAL402_KEY = "f402m_other";
    try {
      assert.equal(resolveMerchantKey(), "f402m_merchant");
    } finally {
      if (prev === undefined) delete process.env.FISCAL402_MERCHANT_KEY;
      else process.env.FISCAL402_MERCHANT_KEY = prev;
      if (prevKey === undefined) delete process.env.FISCAL402_KEY;
      else process.env.FISCAL402_KEY = prevKey;
    }
  });

  it("ignores operator-shaped FISCAL402_API_KEY", () => {
    const prev = process.env.FISCAL402_MERCHANT_KEY;
    const prevApi = process.env.FISCAL402_API_KEY;
    const prevKey = process.env.FISCAL402_KEY;
    delete process.env.FISCAL402_MERCHANT_KEY;
    delete process.env.FISCAL402_KEY;
    process.env.FISCAL402_API_KEY = "operator-root-secret";
    try {
      assert.equal(resolveMerchantKey(), undefined);
    } finally {
      if (prev === undefined) delete process.env.FISCAL402_MERCHANT_KEY;
      else process.env.FISCAL402_MERCHANT_KEY = prev;
      if (prevApi === undefined) delete process.env.FISCAL402_API_KEY;
      else process.env.FISCAL402_API_KEY = prevApi;
      if (prevKey === undefined) delete process.env.FISCAL402_KEY;
      else process.env.FISCAL402_KEY = prevKey;
    }
  });
});

describe("redaction", () => {
  it("masks live-looking merchant keys", () => {
    const masked = redactSecrets("header f402m_abcDEF1234567890 and X-Fiscal402-Key");
    assert.equal(masked.includes("f402m_abcDEF1234567890"), false);
    assert.match(masked, /f402m_\*\*\*\*/);
  });

  it("leaves the public placeholder intact", () => {
    assert.equal(maskMerchantKey("f402m_your_key_here"), "f402m_your_key_here");
  });
});

describe("version", () => {
  it("matches package.json", () => {
    const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8")) as { version: string };
    assert.equal(VERSION, pkg.version);
  });
});
