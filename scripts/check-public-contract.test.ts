import assert from "node:assert/strict";
import test from "node:test";
import { checkLocalDocs, denyStale, PUBLIC_TRUTH, checkCodingAgentSkill } from "./check-public-contract.ts";

test("correct local docs pass denylist", () => {
  const report = checkLocalDocs();
  assert.equal(
    report.ok,
    true,
    report.results
      .filter((r) => r.status === "FAIL")
      .map((r) => `${r.surface}:${r.actual}`)
      .join("; "),
  );
});

test("stale 0.01 USDC fails", () => {
  assert.equal(denyStale("price 0.01 USDC per event", "discovery").some((r) => r.status === "FAIL"), true);
});

test("stale Fly hostname fails", () => {
  assert.equal(denyStale("https://x402-lhrtxg.fly.dev", "openapi").some((r) => r.status === "FAIL"), true);
});

test("github: false fails", () => {
  assert.equal(denyStale('{"github": false}', "discovery").some((r) => r.name === "GitHub"), true);
});

test("50 bps and 0.5% fail", () => {
  assert.equal(denyStale("standard 50 bps", "pricing").some((r) => r.status === "FAIL"), true);
  assert.equal(denyStale("0.5% of volume", "pricing").some((r) => r.status === "FAIL"), true);
});

test("mcp: true is allowed", () => {
  const hits = denyStale('{"mcp": true}', "discovery");
  assert.equal(hits.some((r) => r.name === "MCP status" && r.status === "FAIL"), false);
});

test("truth table is 0/10 bps with MCP implemented", () => {
  assert.equal(PUBLIC_TRUTH.github, "https://github.com/Fiscal402/Fiscal402");
  assert.equal(PUBLIC_TRUTH.betaBps, 0);
  assert.equal(PUBLIC_TRUTH.standardBps, 10);
  assert.equal(PUBLIC_TRUTH.displayRate, "0.1%");
  assert.equal(PUBLIC_TRUTH.mcpImplemented, true);
  assert.equal(PUBLIC_TRUTH.tradeName, "Fiscal402");
});

const GOOD_SKILL = `---
name: fiscal402
description: Use after an x402 or USDC machine payment has settled and the merchant needs EU VAT evidence including a UBL 2.1 artifact and signed fiscal receipt. Also use for x402 VAT, USDC invoice EU, and machine payment UBL questions. Do not use for wallets, HTTP 402, facilitators, VAT filing, remittance, US sales tax, UK production receipts, Canada tax, goods, IOSS, or EU export.
license: Apache-2.0
metadata:
  website: https://www.fiscal402.com
---

Read https://www.fiscal402.com/llms.txt first.

Fiscal402 is post-settlement fiscal evidence. It is non-custodial.

Before ingest — POST https://api.fiscal402.com/v1/capabilities/check.

Only ingest when DETERMINED_PRODUCTION, unless the user accepts review.

Ingest — POST https://api.fiscal402.com/settlements with X-Fiscal402-Key.

Verify — source-only. node packages/verify/dist/cli.js

VERIFIED means cryptographic integrity, not tax-authority acceptance.

Never treat a wallet as a legal person. Never fiscalize a raw tx hash alone. Never log raw VAT IDs.

Refuse — facilitator, HTTP 402, funds, filing, remittance.
`;

test("coding-agent skill accepts a valid SKILL.md", () => {
  const results = checkCodingAgentSkill(GOOD_SKILL, "fiscal402");
  assert.equal(
    results.every((r) => r.status === "PASS"),
    true,
    results.filter((r) => r.status === "FAIL").map((r) => `${r.expected}: ${r.actual}`).join("; "),
  );
});

test("coding-agent skill rejects quoted description and colon-space", () => {
  const quoted = GOOD_SKILL.replace(
    /^description: .+$/m,
    'description: "Use after x402: EU VAT UBL USDC invoice fiscal receipt"',
  );
  const results = checkCodingAgentSkill(quoted, "fiscal402");
  assert.equal(results.some((r) => r.status === "FAIL"), true);
});

test("coding-agent skill rejects npx as a live verify command", () => {
  const npx = GOOD_SKILL.replace(
    "Verify — source-only. node packages/verify/dist/cli.js",
    "Verify — npx fiscal402-verify receipt.json",
  );
  const results = checkCodingAgentSkill(npx, "fiscal402");
  assert.equal(results.some((r) => r.status === "FAIL" && /npx/i.test(r.actual ?? "")), true);
});
