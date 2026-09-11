/**
 * Downstream-style consumer. Depends only on the public verifier,
 * a receipt, JWKS, and optional UBL bytes.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  parseReceipt,
  verifyReceipt,
  outcomeOf,
  type Jwks,
} from "../../packages/verify/dist/index.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const receipt = parseReceipt(readFileSync(join(root, "test-vectors/valid/receipt.json"), "utf8"));
const jwks = JSON.parse(readFileSync(join(root, "test-vectors/valid/jwks.json"), "utf8")) as Jwks;
const ubl = readFileSync(join(root, "test-vectors/valid/invoice.xml"), "utf8");

const report = verifyReceipt({ receipt, jwks, ubl });
const downstream = {
  outcome: outcomeOf(report),
  receipt_id: receipt["receipt_id"] ?? null,
  spec: receipt.spec ?? null,
  spec_version: receipt.spec_version ?? null,
  network: receipt.settlement?.network ?? null,
  tx_hash: receipt.settlement?.tx_hash ?? null,
  asset: receipt.settlement?.asset ?? null,
  wallet_is_legal_identity: receipt.context?.fiscal?.wallet_is_legal_identity === true,
  integrity: {
    verified: report.verified,
    canonical_payload: report.canonical_payload,
    signature: report.signature,
    ubl_sha256: report.ubl_sha256,
  },
  note: "This object is a consumer projection. It is not tax-authority acceptance.",
};

console.log(JSON.stringify(downstream, null, 2));
if (!report.verified) process.exit(1);
