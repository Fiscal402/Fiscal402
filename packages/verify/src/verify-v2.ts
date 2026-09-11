import { verify } from "node:crypto";
import {
  ARTIFACT_HASH_ALG,
  hashArtifactBytes,
  hashCanonicalPayload,
  RECEIPT_CANONICALIZATION,
  RECEIPT_SIGNING_ALG,
  RECEIPT_SPEC,
  RECEIPT_SPEC_VERSION_V2,
  unsignedReceiptBody,
} from "./canonical.js";
import { isIntegerString, isMoney, isRate, isRfc3339Utc, isSha256Hex } from "./money.js";
import type { Jwks, VerifyReport } from "./verify.js";

export type V2ArtifactBytes = {
  id?: string;
  bytes: string | Uint8Array;
};

const CORE_KEYS = new Set([
  "spec",
  "spec_version",
  "receipt_id",
  "issued_at",
  "mode",
  "issuer",
  "event",
  "determinations",
  "artifacts",
  "disclaimer",
  "extensions",
  "integrity",
  "signature",
]);

export function verifyFiscal402ReceiptV2(
  receipt: Record<string, unknown>,
  options: { jwks?: Jwks; publicPem?: string; artifacts?: V2ArtifactBytes[] } = {},
): VerifyReport {
  const notes: string[] = [];
  const schemaOk =
    receipt.spec === RECEIPT_SPEC && receipt.spec_version === RECEIPT_SPEC_VERSION_V2;
  const receipt_schema = schemaOk ? "SUPPORTED" : receipt.spec ? "UNSUPPORTED" : "MISSING";

  const extraCore = Object.keys(receipt).filter((k) => !CORE_KEYS.has(k));
  if (extraCore.length > 0) {
    notes.push(`unknown core fields: ${extraCore.join(",")}`);
  }

  const structural = schemaOk ? structuralProblems(receipt) : [];
  notes.push(...structural);

  const integrity = asRecord(receipt.integrity);
  const storedHash = typeof integrity?.payload_sha256 === "string" ? integrity.payload_sha256 : undefined;
  const canon = typeof integrity?.canonicalization === "string" ? integrity.canonicalization : undefined;

  let canonical_payload: VerifyReport["canonical_payload"] = "LEGACY_STORED_HASH";
  let canonicalization: VerifyReport["canonicalization"] = storedHash ? "legacy-stored-hash" : "none";
  if (!canon) {
    notes.push("missing integrity.canonicalization");
  } else if (canon !== RECEIPT_CANONICALIZATION) {
    notes.push(`unknown canonicalization: ${canon}`);
    canonical_payload = "MISMATCH";
    canonicalization = "none";
  } else if (storedHash && isSha256Hex(storedHash)) {
    const recomputed = hashCanonicalPayload(unsignedReceiptBody(receipt));
    canonical_payload = recomputed === storedHash ? "MATCH" : "MISMATCH";
    canonicalization = RECEIPT_CANONICALIZATION;
  } else {
    notes.push("malformed integrity.payload_sha256");
    canonical_payload = "MISMATCH";
  }

  const event = asRecord(receipt.event);
  const payment = asRecord(event?.payment);
  const settlement = asRecord(payment?.settlement);
  const settlement_reference =
    typeof settlement?.transaction_id === "string" && settlement.transaction_id.length > 0
      ? "PRESENT"
      : "MISSING";

  const artifactsField = Array.isArray(receipt.artifacts) ? receipt.artifacts : [];
  let artifacts: VerifyReport["artifacts"] = options.artifacts?.length ? "NOT_PROVIDED" : "NOT_PROVIDED";
  if (options.artifacts && options.artifacts.length > 0) {
    artifacts = matchArtifacts(artifactsField, options.artifacts);
  }

  const sig = asRecord(receipt.signature);
  let signature: VerifyReport["signature"] = "MALFORMED";
  let signing_key: VerifyReport["signing_key"] = "MISSING";
  let pem: string | undefined = options.publicPem;
  const alg = sig?.alg;
  const keyId = typeof sig?.key_id === "string" ? sig.key_id : undefined;
  const value = typeof sig?.value === "string" ? sig.value : undefined;

  if (alg && alg !== RECEIPT_SIGNING_ALG) {
    notes.push(`unknown signature algorithm: ${String(alg)}`);
  }

  if (options.jwks?.keys && keyId) {
    const found = options.jwks.keys.find((k) => k.kid === keyId);
    if (found?.pem) {
      pem = found.pem;
      signing_key = "JWKS_MATCH";
    } else {
      signing_key = "UNKNOWN_KEY_ID";
    }
  } else if (pem) {
    signing_key = "PROVIDED_PEM";
  }

  if (storedHash && value && alg === RECEIPT_SIGNING_ALG && pem) {
    try {
      const ok = verify(null, Buffer.from(storedHash), pem, Buffer.from(value, "base64"));
      signature = ok ? "VALID" : "INVALID";
    } catch {
      signature = "MALFORMED";
    }
  } else if (value && !pem) {
    signature = "MALFORMED";
  }

  const hardFail =
    receipt_schema !== "SUPPORTED" ||
    extraCore.length > 0 ||
    structural.length > 0 ||
    signature !== "VALID" ||
    canonical_payload === "MISMATCH" ||
    artifacts === "MISMATCH" ||
    settlement_reference === "MISSING" ||
    signing_key === "UNKNOWN_KEY_ID" ||
    alg !== RECEIPT_SIGNING_ALG ||
    canon !== RECEIPT_CANONICALIZATION;

  const result: VerifyReport["result"] = hardFail
    ? "INVALID"
    : signature === "VALID" && settlement_reference === "PRESENT"
      ? "VERIFIED"
      : "INCOMPLETE";

  notes.push("verified means Fiscal402 receipt integrity, not tax-authority acceptance.");
  notes.push("v2 VERIFIED does not mean tax filing, legal compliance, or correct tax-law interpretation.");

  return {
    verified: result === "VERIFIED",
    legacy: false,
    spec_version: RECEIPT_SPEC_VERSION_V2,
    canonicalization,
    receipt_schema,
    canonical_payload,
    signature,
    signing_key,
    ubl_sha256: "NOT_PROVIDED",
    artifacts,
    settlement_reference,
    wallet_not_legal_identity: true,
    result,
    notes,
  };
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (value && typeof value === "object" && !Array.isArray(value)) return value as Record<string, unknown>;
  return undefined;
}

function matchArtifacts(
  declared: unknown[],
  supplied: V2ArtifactBytes[],
): NonNullable<VerifyReport["artifacts"]> {
  const byId = new Map<string, { alg?: string; value?: string }>();
  const hashes: string[] = [];
  for (const item of declared) {
    const rec = asRecord(item);
    const hash = asRecord(rec?.hash);
    if (typeof rec?.id === "string") {
      byId.set(rec.id, {
        alg: typeof hash?.alg === "string" ? hash.alg : undefined,
        value: typeof hash?.value === "string" ? hash.value : undefined,
      });
    }
    if (typeof hash?.value === "string") hashes.push(hash.value);
  }

  let matched = 0;
  for (const item of supplied) {
    const digest = hashArtifactBytes(item.bytes);
    const expected = item.id ? byId.get(item.id) : undefined;
    if (expected) {
      if (expected.alg && expected.alg !== ARTIFACT_HASH_ALG) return "MISMATCH";
      if (expected.value !== digest) return "MISMATCH";
      matched += 1;
      continue;
    }
    if (hashes.includes(digest)) {
      matched += 1;
      continue;
    }
    return "MISMATCH";
  }
  if (matched === 0) return "NOT_PROVIDED";
  if (matched < supplied.length) return "PARTIAL";
  return "MATCH";
}

function structuralProblems(receipt: Record<string, unknown>): string[] {
  const problems: string[] = [];
  if (typeof receipt.receipt_id !== "string" || receipt.receipt_id.length === 0) {
    problems.push("missing receipt_id");
  }
  if (!isRfc3339Utc(receipt.issued_at)) problems.push("issued_at must be RFC 3339 UTC");

  const event = asRecord(receipt.event);
  if (!event) {
    problems.push("missing event");
    return problems;
  }
  if (!isRfc3339Utc(event.occurred_at)) problems.push("event.occurred_at must be RFC 3339 UTC");
  const payment = asRecord(event.payment);
  const settlement = asRecord(payment?.settlement);
  const protocol = asRecord(payment?.protocol);
  if (!protocol || typeof protocol.name !== "string") problems.push("missing event.payment.protocol.name");
  if (!settlement || typeof settlement.transaction_id !== "string") {
    problems.push("missing event.payment.settlement.transaction_id");
  }
  const asset = asRecord(settlement?.asset);
  if (!asset || typeof asset.identifier !== "string") problems.push("missing settlement asset");
  if (asset && !isIntegerString(asset.amount_base_units)) {
    problems.push("malformed monetary integer: asset.amount_base_units");
  }
  const parties = asRecord(event.parties);
  if (!asRecord(parties?.seller)) problems.push("missing event.parties.seller");
  const supply = asRecord(event.supply);
  if (!supply || typeof supply.kind !== "string") problems.push("missing event.supply.kind");

  if (!Array.isArray(receipt.determinations) || receipt.determinations.length < 1) {
    problems.push("determinations must be a non-empty array");
  } else {
    for (const [i, item] of receipt.determinations.entries()) {
      const d = asRecord(item);
      if (!d) {
        problems.push(`determination[${i}] not an object`);
        continue;
      }
      for (const key of ["jurisdiction", "regime", "engine", "ruleset_version", "status"] as const) {
        if (typeof d[key] !== "string") problems.push(`determination[${i}].${key} required`);
      }
      const status = d.status;
      if (status !== "DETERMINED" && status !== "MANUAL_REVIEW" && status !== "UNDETERMINED") {
        problems.push(`determination[${i}].status unknown`);
      }
      if (d.rate !== undefined && !isRate(d.rate)) problems.push(`determination[${i}].rate malformed`);
      if (d.tax_amount !== undefined && !isMoney(d.tax_amount)) {
        problems.push(`determination[${i}].tax_amount malformed`);
      }
      if (d.taxable_amount !== undefined && !isMoney(d.taxable_amount)) {
        problems.push(`determination[${i}].taxable_amount malformed`);
      }
      if (status !== "DETERMINED" && (d.rate !== undefined || d.tax_amount !== undefined)) {
        problems.push(`determination[${i}] has tax fields but status is not DETERMINED`);
      }
    }
  }

  if (receipt.artifacts !== undefined && !Array.isArray(receipt.artifacts)) {
    problems.push("artifacts must be an array");
  } else if (Array.isArray(receipt.artifacts)) {
    for (const [i, item] of receipt.artifacts.entries()) {
      const a = asRecord(item);
      if (!a) {
        problems.push(`artifacts[${i}] not an object`);
        continue;
      }
      if (typeof a.id !== "string" || typeof a.type !== "string" || typeof a.media_type !== "string") {
        problems.push(`artifacts[${i}] missing id/type/media_type`);
      }
      const hash = asRecord(a.hash);
      if (!hash || hash.alg !== ARTIFACT_HASH_ALG || !isSha256Hex(hash.value)) {
        problems.push(`artifacts[${i}] hash malformed`);
      }
    }
  }

  const sig = asRecord(receipt.signature);
  if (!sig || sig.alg !== RECEIPT_SIGNING_ALG) problems.push("signature.alg must be ed25519");

  return problems;
}
