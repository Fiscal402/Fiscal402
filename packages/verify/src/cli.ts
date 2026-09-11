#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { parseReceipt, outcomeOf, verifyReceipt, type Jwks, type V2ArtifactBytes } from "./index.js";

function arg(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  if (i < 0) return undefined;
  return process.argv[i + 1];
}

function args(flag: string): string[] {
  const out: string[] = [];
  for (let i = 0; i < process.argv.length; i += 1) {
    if (process.argv[i] === flag && process.argv[i + 1]) out.push(process.argv[i + 1] as string);
  }
  return out;
}

const receiptPath = process.argv[2] && !process.argv[2].startsWith("-") ? process.argv[2] : undefined;
if (!receiptPath || process.argv.includes("--help") || process.argv.includes("-h")) {
  console.error(
    "usage: fiscal402-verify <receipt.json> [--jwks jwks.json] [--ubl invoice.xml] [--artifact file] [--artifact-id id=file]",
  );
  process.exit(receiptPath ? 0 : 2);
}

const raw = readFileSync(receiptPath, "utf8");
const receipt = parseReceipt(raw);
const ublPath = arg("--ubl") ?? (process.argv[3] && !process.argv[3].startsWith("-") ? process.argv[3] : undefined);
const jwksPath = arg("--jwks") ?? (process.argv[4] && !process.argv[4].startsWith("-") ? process.argv[4] : undefined);
const ubl = ublPath ? readFileSync(ublPath, "utf8") : undefined;
const jwks = jwksPath ? (JSON.parse(readFileSync(jwksPath, "utf8")) as Jwks) : undefined;

const artifacts: V2ArtifactBytes[] = [];
for (const path of args("--artifact")) {
  artifacts.push({ bytes: readFileSync(path, "utf8") });
}
for (const spec of args("--artifact-id")) {
  const eq = spec.indexOf("=");
  if (eq <= 0) continue;
  artifacts.push({ id: spec.slice(0, eq), bytes: readFileSync(spec.slice(eq + 1), "utf8") });
}

const report = verifyReceipt({
  receipt: raw,
  ...(ubl ? { ubl } : {}),
  ...(jwks ? { jwks } : {}),
  ...(artifacts.length ? { artifacts } : {}),
});
const outcome = outcomeOf(report);
console.log(JSON.stringify({ outcome, report, spec_version: receipt.spec_version }, null, 2));
process.exit(outcome === "VERIFIED" ? 0 : 1);
