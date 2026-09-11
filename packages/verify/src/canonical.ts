import { createHash } from "node:crypto";

/** Compact UTF-8 JSON with lexicographically sorted object keys. No extra whitespace. */
export function stableStringify(value: unknown): string {
  return JSON.stringify(sortValue(value));
}

function sortValue(value: unknown): unknown {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(sortValue);
  const rec = value as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(rec).sort()) {
    const item = rec[key];
    if (item === undefined) continue;
    out[key] = sortValue(item);
  }
  return out;
}

export const UBL_HASH_ALG = "sha256-utf8-bytes";
export const RECEIPT_CANONICALIZATION = "fiscal402.sorted-json/1";
export const RECEIPT_SPEC = "fiscal402.receipt";
export const RECEIPT_SPEC_VERSION = "1.0.0";
export const RECEIPT_SIGNING_ALG = "ed25519";

/** SHA-256 of the exact UTF-8 bytes of the bound artifact. No XML C14N. */
export function hashUblBytes(xml: string): string {
  return createHash("sha256").update(xml, "utf8").digest("hex");
}

export function hashCanonicalPayload(unsignedBody: unknown): string {
  return createHash("sha256").update(stableStringify(unsignedBody), "utf8").digest("hex");
}

export function unsignedReceiptBody(receipt: Record<string, unknown>): Record<string, unknown> {
  const { hashes: _h, signature: _s, ...rest } = receipt;
  return rest;
}
