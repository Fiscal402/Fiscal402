import assert from "node:assert/strict";
import test from "node:test";
import { checkLocalDocs, denyStale, PUBLIC_TRUTH } from "./check-public-contract.ts";

test("correct local docs pass denylist", () => {
  const report = checkLocalDocs();
  assert.equal(report.ok, true, report.results.filter((r) => r.status === "FAIL").map((r) => `${r.surface}:${r.actual}`).join("; "));
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

test("mcp: true fails", () => {
  assert.equal(denyStale('{"mcp": true}', "discovery").some((r) => r.name === "MCP status"), true);
});

test("truth table is the public protocol repo", () => {
  assert.equal(PUBLIC_TRUTH.github, "https://github.com/Fiscal402/Fiscal402");
  assert.equal(PUBLIC_TRUTH.betaBps, 0);
  assert.equal(PUBLIC_TRUTH.standardBps, 50);
});
