import assert from "node:assert/strict";
import test from "node:test";
import { checkLocalDocs, denyStale, PUBLIC_TRUTH } from "./check-public-contract.ts";

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
