import { verify } from "node:crypto";
import {
  hashCanonicalPayload,
  hashUblBytes,
  RECEIPT_CANONICALIZATION,
  RECEIPT_SPEC,
  RECEIPT_SPEC_VERSION,
  unsignedReceiptBody,
} from "./canonical.js";

export type Fiscal402Receipt = {
  spec?: string;
  spec_version?: string;
  hashes?: { canonical_payload_sha256?: string; canonicalization?: string };
  signature?: { alg?: string; key_id?: string; value?: string };
  artifacts?: { ubl_sha256?: string; settlement_id?: string; ledger_id?: string; ubl_hash_alg?: string };
  settlement?: {
    network?: string;
    tx_hash?: string;
    asset?: string;
    amount_usdc?: string;
    payer?: string;
    pay_to?: string;
  };
  context?: { fiscal?: { wallet_is_legal_identity?: boolean } };
  [key: string]: unknown;
};

export type Jwks = { keys?: { kid?: string; pem?: string; kty?: string; crv?: string; use?: string }[] };

export type VerifyReport = {
  verified: boolean;
  legacy: boolean;
  canonicalization: typeof RECEIPT_CANONICALIZATION | "legacy-stored-hash" | "none";
  receipt_schema: "SUPPORTED" | "UNSUPPORTED" | "MISSING";
  canonical_payload: "MATCH" | "MISMATCH" | "LEGACY_STORED_HASH";
  signature: "VALID" | "INVALID" | "MALFORMED";
  signing_key: "JWKS_MATCH" | "PROVIDED_PEM" | "UNKNOWN_KEY_ID" | "MISSING";
  ubl_sha256: "MATCH" | "MISMATCH" | "NOT_PROVIDED";
  settlement_reference: "PRESENT" | "MISSING";
  wallet_not_legal_identity: boolean;
  result: "VERIFIED" | "INVALID" | "INCOMPLETE";
  notes: string[];
};

export type VerifyOutcome =
  | "VERIFIED"
  | "INVALID"
  | "UNKNOWN_KEY"
  | "ARTIFACT_MISMATCH"
  | "UNSUPPORTED_VERSION";

export function parseReceipt(input: unknown): Fiscal402Receipt {
  if (typeof input === "string") {
    return JSON.parse(input) as Fiscal402Receipt;
  }
  if (input && typeof input === "object") {
    return input as Fiscal402Receipt;
  }
  throw new TypeError("receipt must be a JSON object or JSON string");
}

export function verifyArtifactHash(artifactUtf8: string, expectedSha256Hex: string): boolean {
  return hashUblBytes(artifactUtf8) === expectedSha256Hex;
}

export function verifyFiscal402Receipt(
  receipt: Fiscal402Receipt,
  options: { ubl?: string; ublXml?: string; jwks?: Jwks; publicPem?: string } = {},
): VerifyReport {
  const notes: string[] = [];
  const schemaOk = receipt.spec === RECEIPT_SPEC && receipt.spec_version === RECEIPT_SPEC_VERSION;
  const receipt_schema = schemaOk ? "SUPPORTED" : receipt.spec ? "UNSUPPORTED" : "MISSING";

  const storedHash = receipt.hashes?.canonical_payload_sha256;
  const canon = receipt.hashes?.canonicalization;
  const isSortedJson = canon === RECEIPT_CANONICALIZATION;
  let canonical_payload: VerifyReport["canonical_payload"] = "LEGACY_STORED_HASH";
  let canonicalization: VerifyReport["canonicalization"] = storedHash ? "legacy-stored-hash" : "none";
  if (storedHash && isSortedJson) {
    const recomputed = hashCanonicalPayload(unsignedReceiptBody(receipt as Record<string, unknown>));
    canonical_payload = recomputed === storedHash ? "MATCH" : "MISMATCH";
    canonicalization = RECEIPT_CANONICALIZATION;
  } else if (storedHash) {
    notes.push(
      "legacy receipt: signature checked against stored hash; payload was not recomputed with fiscal402.sorted-json/1",
    );
  }

  const settlement_reference =
    receipt.settlement?.network && receipt.settlement.tx_hash ? "PRESENT" : "MISSING";

  const ublBytes = options.ubl ?? options.ublXml;
  let ubl_sha256: VerifyReport["ubl_sha256"] = "NOT_PROVIDED";
  if (ublBytes && receipt.artifacts?.ubl_sha256) {
    ubl_sha256 = hashUblBytes(ublBytes) === receipt.artifacts.ubl_sha256 ? "MATCH" : "MISMATCH";
  }

  const sig = receipt.signature;
  let signature: VerifyReport["signature"] = "MALFORMED";
  let signing_key: VerifyReport["signing_key"] = "MISSING";
  let pem: string | undefined = options.publicPem;
  if (options.jwks?.keys && sig?.key_id) {
    const found = options.jwks.keys.find((k) => k.kid === sig.key_id);
    if (found?.pem) {
      pem = found.pem;
      signing_key = "JWKS_MATCH";
    } else {
      signing_key = "UNKNOWN_KEY_ID";
    }
  } else if (pem) {
    signing_key = "PROVIDED_PEM";
  }

  if (storedHash && sig?.value && sig.alg === "ed25519" && pem) {
    try {
      const ok = verify(null, Buffer.from(storedHash), pem, Buffer.from(sig.value, "base64"));
      signature = ok ? "VALID" : "INVALID";
    } catch {
      signature = "MALFORMED";
    }
  } else if (sig?.value && !pem) {
    signature = "MALFORMED";
  }

  const wallet_not_legal_identity = receipt.context?.fiscal?.wallet_is_legal_identity === false;
  const legacy = canonical_payload === "LEGACY_STORED_HASH";

  const hardFail =
    receipt_schema !== "SUPPORTED" ||
    signature !== "VALID" ||
    canonical_payload === "MISMATCH" ||
    ubl_sha256 === "MISMATCH" ||
    settlement_reference === "MISSING" ||
    signing_key === "UNKNOWN_KEY_ID";

  const result: VerifyReport["result"] = hardFail
    ? "INVALID"
    : signature === "VALID" && settlement_reference === "PRESENT"
      ? "VERIFIED"
      : "INCOMPLETE";

  notes.push("verified means Fiscal402 receipt integrity, not tax-authority acceptance.");
  return {
    verified: result === "VERIFIED",
    legacy,
    canonicalization,
    receipt_schema,
    canonical_payload,
    signature,
    signing_key,
    ubl_sha256,
    settlement_reference,
    wallet_not_legal_identity,
    result,
    notes,
  };
}

export function verifyReceipt(input: {
  receipt: Fiscal402Receipt;
  ubl?: string;
  jwks?: Jwks;
  publicPem?: string;
}): VerifyReport {
  return verifyFiscal402Receipt(input.receipt, {
    ...(input.ubl ? { ubl: input.ubl } : {}),
    ...(input.jwks ? { jwks: input.jwks } : {}),
    ...(input.publicPem ? { publicPem: input.publicPem } : {}),
  });
}

/** Map a report to a CLI/consumer outcome. Does not invent checks. */
export function outcomeOf(report: VerifyReport): VerifyOutcome {
  if (report.receipt_schema === "UNSUPPORTED" || report.receipt_schema === "MISSING") {
    return "UNSUPPORTED_VERSION";
  }
  if (report.signing_key === "UNKNOWN_KEY_ID") return "UNKNOWN_KEY";
  if (report.ubl_sha256 === "MISMATCH") return "ARTIFACT_MISMATCH";
  if (report.result === "VERIFIED") return "VERIFIED";
  return "INVALID";
}
