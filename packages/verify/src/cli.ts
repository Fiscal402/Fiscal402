#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { parseReceipt, outcomeOf, verifyFiscal402Receipt, type Jwks } from "./index.js";

function arg(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  if (i < 0) return undefined;
  return process.argv[i + 1];
}

const receiptPath = process.argv[2] && !process.argv[2].startsWith("-") ? process.argv[2] : undefined;
if (!receiptPath || process.argv.includes("--help") || process.argv.includes("-h")) {
  console.error("usage: fiscal402-verify <receipt.json> [--jwks jwks.json] [--ubl invoice.xml]");
  process.exit(receiptPath ? 0 : 2);
}

const receipt = parseReceipt(readFileSync(receiptPath, "utf8"));
const ublPath = arg("--ubl") ?? (process.argv[3] && !process.argv[3].startsWith("-") ? process.argv[3] : undefined);
const jwksPath = arg("--jwks") ?? (process.argv[4] && !process.argv[4].startsWith("-") ? process.argv[4] : undefined);
const ubl = ublPath ? readFileSync(ublPath, "utf8") : undefined;
const jwks = jwksPath ? (JSON.parse(readFileSync(jwksPath, "utf8")) as Jwks) : undefined;
const report = verifyFiscal402Receipt(receipt, {
  ...(ubl ? { ubl } : {}),
  ...(jwks ? { jwks } : {}),
});
const outcome = outcomeOf(report);
console.log(JSON.stringify({ outcome, report }, null, 2));
process.exit(outcome === "VERIFIED" ? 0 : 1);
