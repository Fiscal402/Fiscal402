import { redactSecrets, type VerifyReport } from "@fiscal402/sdk";

function mark(ok: boolean): string {
  return ok ? "ok" : "fail";
}

export function formatVerify(report: VerifyReport, receiptId?: string): string {
  const rows: [boolean, string, string][] = [
    [report.receipt_schema === "SUPPORTED", "Schema", report.receipt_schema],
    [report.canonical_payload === "MATCH", "Canonical payload", report.canonical_payload],
    [report.signature === "VALID", "Signature", report.signature],
    [
      report.signing_key === "JWKS_MATCH" || report.signing_key === "PROVIDED_PEM",
      "Key",
      report.signing_key,
    ],
    [report.ubl_sha256 !== "MISMATCH", "UBL binding", report.ubl_sha256],
    [report.settlement_reference === "PRESENT", "Settlement", report.settlement_reference],
  ];
  const pad = Math.max(...rows.map(([, k]) => k.length));
  const body = rows.map(([ok, k, v]) => `${mark(ok).padEnd(4)}  ${k.padEnd(pad)}  ${v}`).join("\n");
  const id = receiptId ? `receipt  ${receiptId}\n` : "";
  return `${id}${body}\n\n${report.result}\nnote  verified means receipt integrity, not tax-authority acceptance`;
}

export function formatJson(value: unknown): string {
  return redactSecrets(JSON.stringify(value, null, 2));
}

export function formatCapabilities(doc: {
  protocol_version?: string;
  tax_ruleset_version?: string;
  custody?: string;
  capabilities?: string[];
  jurisdictions?: Record<string, { status?: string } | unknown>;
}): string {
  const caps = (doc.capabilities ?? []).join(", ") || "(none)";
  const jurisdictions = doc.jurisdictions
    ? Object.entries(doc.jurisdictions)
        .map(([id, row]) => {
          const status =
            row && typeof row === "object" && "status" in row
              ? String((row as { status?: string }).status)
              : "";
          return `  ${id}${status ? `  ${status}` : ""}`;
        })
        .join("\n")
    : "  (none)";
  return [
    `Fiscal402 ${doc.protocol_version ?? ""}`.trim(),
    `ruleset   ${doc.tax_ruleset_version ?? ""}`,
    `custody   ${doc.custody ?? ""}`,
    `capabilities`,
    `  ${caps}`,
    `jurisdictions`,
    jurisdictions,
  ].join("\n");
}
