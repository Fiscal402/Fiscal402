#!/usr/bin/env node
/** Public protocol contract checker.
 * Local: npm run check:public
 * Live:  npm run check:public:live
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const PUBLIC_TRUTH = {
  name: "Fiscal402",
  website: "https://www.fiscal402.com",
  api: "https://api.fiscal402.com",
  github: "https://github.com/Fiscal402/Fiscal402",
  betaBps: 0,
  standardBps: 10,
  displayRate: "0.1%",
  receipt: "fiscal402.receipt/1.0.0",
  mcpImplemented: true,
  tradeName: "Fiscal402",
} as const;

export const STALE = [
  "0.01 USDC",
  "x402-lhrtxg.fly.dev",
  "grok.me",
  "50 bps",
  "0.5%",
] as const;

export type Outcome = {
  name: string;
  status: "PASS" | "FAIL";
  expected?: string;
  actual?: string;
  surface?: string;
  url?: string;
};

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function fail(name: string, expected: string, actual: string, surface?: string, url?: string): Outcome {
  const out: Outcome = { name, status: "FAIL", expected, actual };
  if (surface) out.surface = surface;
  if (url) out.url = url;
  return out;
}
function pass(name: string): Outcome {
  return { name, status: "PASS" };
}

function isLegalPlaceholder(value: string | null | undefined): boolean {
  if (value == null) return true;
  const v = value.trim();
  if (!v) return true;
  return /TODO|HOLDING B\.V\. STATUTAIRE|\[8 digits\]|\[NL\.\.\.B\.\.\]|placeholder|pending_kvk|EXACT\]/i.test(v);
}

export function denyStale(text: string, surface: string): Outcome[] {
  const hits: Outcome[] = [];
  for (const stale of STALE) {
    if (text.includes(stale)) hits.push(fail("stale public values", `absent ${stale}`, `present in ${surface}`, surface));
  }
  if (/["']github["']\s*:\s*false/.test(text)) hits.push(fail("GitHub", PUBLIC_TRUTH.github, "github: false", surface));
  return hits.length ? hits : [pass("stale public values")];
}

const SKILL_TRIGGERS = ["x402", "EU VAT", "UBL", "USDC invoice", "fiscal receipt"] as const;
const SKILL_REFUSALS = ["wallet", "HTTP 402", "facilitat", "filing", "remittance", "US sales tax", "UK", "Canada"] as const;

export function checkCodingAgentSkill(text: string, directoryName: string): Outcome[] {
  const results: Outcome[] = [];
  if (!text.startsWith("---\n")) {
    return [fail("coding-agent skill", "YAML frontmatter", "missing", "skills/fiscal402/SKILL.md")];
  }
  const end = text.indexOf("\n---\n", 4);
  if (end < 0) {
    return [fail("coding-agent skill", "closed frontmatter", "unclosed", "skills/fiscal402/SKILL.md")];
  }
  const fm = text.slice(4, end);
  const body = text.slice(end + 5);
  const name = /^name:\s*(\S+)\s*$/m.exec(fm)?.[1];
  if (name !== "fiscal402" || directoryName !== "fiscal402") {
    results.push(
      fail("coding-agent skill", "name=fiscal402 matching directory", `${name ?? "missing"} / ${directoryName}`, "skills/fiscal402/SKILL.md"),
    );
  } else results.push(pass("coding-agent skill name"));
  const description = /^description:\s*(.*)$/m.exec(fm)?.[1] ?? "";
  if (/^["']/.test(description) || /["']$/.test(description.trim())) {
    results.push(fail("coding-agent skill", "unquoted description scalar", "quoted", "skills/fiscal402/SKILL.md"));
  }
  if (/: /.test(description) || /[<>]/.test(description)) {
    results.push(
      fail("coding-agent skill", "no colon-space or <> in description", description.slice(0, 120), "skills/fiscal402/SKILL.md"),
    );
  }
  const missingTriggers = SKILL_TRIGGERS.filter((term) => !description.includes(term));
  if (missingTriggers.length) {
    results.push(
      fail(
        "coding-agent skill",
        `description triggers: ${SKILL_TRIGGERS.join(", ")}`,
        `missing ${missingTriggers.join(", ")}`,
        "skills/fiscal402/SKILL.md",
      ),
    );
  } else results.push(pass("coding-agent skill description"));
  const missingRefusals = SKILL_REFUSALS.filter((term) => !description.toLowerCase().includes(term.toLowerCase()));
  if (missingRefusals.length) {
    results.push(
      fail("coding-agent skill", "description refusals", `missing ${missingRefusals.join(", ")}`, "skills/fiscal402/SKILL.md"),
    );
  }
  const bodyLines = body.split("\n").length;
  if (bodyLines > 50) {
    results.push(fail("coding-agent skill", "body < 50 lines", `${bodyLines} lines`, "skills/fiscal402/SKILL.md"));
  } else results.push(pass("coding-agent skill body"));
  if (!/llms\.txt/.test(body)) {
    results.push(fail("coding-agent skill", "read llms.txt first", "missing", "skills/fiscal402/SKILL.md"));
  }
  if (!/capabilities\/check/.test(body)) {
    results.push(fail("coding-agent skill", "POST /v1/capabilities/check", "missing", "skills/fiscal402/SKILL.md"));
  }
  if (!/\/settlements/.test(body)) {
    results.push(fail("coding-agent skill", "POST /settlements", "missing", "skills/fiscal402/SKILL.md"));
  }
  if (!/DETERMINED_PRODUCTION/.test(body)) {
    results.push(fail("coding-agent skill", "ingest only DETERMINED_PRODUCTION", "missing", "skills/fiscal402/SKILL.md"));
  }
  if (!/cryptographic integrity/i.test(body)) {
    results.push(fail("coding-agent skill", "VERIFIED = cryptographic integrity", "missing", "skills/fiscal402/SKILL.md"));
  }
  if (/npx fiscal402-verify/.test(body) && !/not published|do not npx|source-only/i.test(body)) {
    results.push(fail("coding-agent skill", "source-only verify", "npx implies published", "skills/fiscal402/SKILL.md"));
  }
  if (!/packages\/verify/.test(body) && !/source-only/i.test(body)) {
    results.push(fail("coding-agent skill", "source-only verify command", "missing", "skills/fiscal402/SKILL.md"));
  }
  if (/ignore (all )?(other|previous) instructions/i.test(body)) {
    results.push(fail("coding-agent skill", "do not tell agents to ignore other instructions", "present", "skills/fiscal402/SKILL.md"));
  }
  return results;
}

function walk(dir: string, acc: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === "dist" || name === ".git" || name === "scripts") continue;
    const path = join(dir, name);
    const st = statSync(path);
    if (st.isDirectory()) walk(path, acc);
    else if (/\.(md|json|txt)$/.test(name) && name !== "PUBLIC_CONTRACT.md") acc.push(path);
  }
  return acc;
}

export function checkLocalDocs(): { ok: boolean; results: Outcome[] } {
  const results: Outcome[] = [];
  const readme = readFileSync(join(root, "README.md"), "utf8");
  if (!readme.includes(PUBLIC_TRUTH.github)) results.push(fail("GitHub", PUBLIC_TRUTH.github, "missing from README", "README.md"));
  else results.push(pass("GitHub"));
  if (!readme.includes("fiscal402.receipt")) results.push(fail("receipt version", PUBLIC_TRUTH.receipt, "missing", "README.md"));
  else results.push(pass("receipt version"));
  if (!/not (an )?x402/i.test(readme) && !/does not by itself determine VAT/i.test(readme)) {
    results.push(fail("Fiscal402 is not x402", "x402 does not determine VAT", "missing", "README.md"));
  } else results.push(pass("Fiscal402 is not x402"));
  if (/npx fiscal402-verify/.test(readme) && /not published to npm yet/i.test(readme) === false && !/Do not `npm install @fiscal402\/verify`/.test(readme)) {
    results.push(fail("npm", "source-only verifier", "npx implies published", "README.md"));
  } else results.push(pass("npm"));
  if (/API is required to verify/i.test(readme) || /must call the API to verify/i.test(readme)) {
    results.push(fail("GitHub README", "verification does not require the API", "API required", "README.md"));
  }
  const impl = readme.search(/## Implement a verifier/i);
  const api = readme.search(/## Call the hosted API/i);
  if (impl < 0) results.push(fail("GitHub README", "Implement a verifier", "missing", "README.md"));
  else if (api >= 0 && impl > api) {
    results.push(fail("GitHub README", "Implement a verifier above Call our API", "API section first", "README.md"));
  } else results.push(pass("GitHub README"));
  if (!/whoever runs the tax engine/.test(readme)) {
    results.push(fail("protocol copy", "north star sentence", "missing", "README.md"));
  }
  if (!/A\. Verify/.test(readme) || !/B\. Issue/.test(readme) || !/C\. Consume/.test(readme)) {
    results.push(fail("protocol copy", "compatibility A/B/C", "missing", "README.md"));
  } else results.push(pass("protocol copy"));
  if (/Fiscal402 Foundation/.test(readme) || /EU-approved/.test(readme)) {
    results.push(fail("overclaim", "no Foundation / EU-approved", "present", "README.md"));
  }
  const firstHeading = /^\s*## .+$/m.exec(readme)?.[0] ?? "";
  if (!/For coding agents/i.test(firstHeading)) {
    results.push(fail("GitHub README", "For coding agents first ## section", firstHeading || "missing", "README.md"));
  } else results.push(pass("coding-agent README"));
  if (!/skills\/fiscal402\/SKILL\.md/.test(readme)) {
    results.push(fail("GitHub README", "skills/fiscal402/SKILL.md", "missing", "README.md"));
  }
  try {
    const agents = readFileSync(join(root, "AGENTS.md"), "utf8");
    if (!/skills\/fiscal402\/SKILL\.md/.test(agents) || !/llms\.txt/.test(agents)) {
      results.push(fail("coding-agent skill", "AGENTS.md points at skill + llms.txt", "missing", "AGENTS.md"));
    } else if (agents.split("\n").length > 60) {
      results.push(fail("coding-agent skill", "AGENTS.md < 60 lines", `${agents.split("\n").length} lines`, "AGENTS.md"));
    } else results.push(pass("coding-agent AGENTS.md"));
  } catch {
    results.push(fail("coding-agent skill", "AGENTS.md", "missing", "AGENTS.md"));
  }
  try {
    const skill = readFileSync(join(root, "skills/fiscal402/SKILL.md"), "utf8");
    results.push(...checkCodingAgentSkill(skill, "fiscal402"));
  } catch (error) {
    results.push(
      fail(
        "coding-agent skill",
        "skills/fiscal402/SKILL.md",
        error instanceof Error ? error.message : String(error),
        "skills/fiscal402/SKILL.md",
      ),
    );
  }
  try {
    const schema = JSON.parse(readFileSync(join(root, "schemas/fiscal402.receipt-1.0.0.schema.json"), "utf8")) as {
      required?: string[];
    };
    const required = schema.required ?? [];
    const frozen = ["spec", "spec_version", "settlement", "artifacts", "hashes", "signature"];
    const extra = required.filter((field) => !frozen.includes(field));
    const missing = frozen.filter((field) => !required.includes(field));
    if (extra.length || missing.length) {
      results.push(
        fail("receipt v1 schema", frozen.join(", "), `missing=${missing.join(",")} extra=${extra.join(",")}`, "schema"),
      );
    } else results.push(pass("receipt v1 schema"));
  } catch (error) {
    results.push(fail("receipt v1 schema", "readable frozen schema", error instanceof Error ? error.message : String(error), "schema"));
  }
  try {
    const compatibility = readFileSync(join(root, "docs/COMPATIBILITY.md"), "utf8");
    if (!/A\. Verify/.test(compatibility) || !/whoever runs the tax engine/.test(compatibility)) {
      results.push(fail("protocol copy", "COMPATIBILITY.md A/B/C", "missing", "docs/COMPATIBILITY.md"));
    }
    if (!/Fiscal402 is not x402/i.test(compatibility) && !/payment standard/.test(compatibility)) {
      results.push(fail("Fiscal402 is not x402", "present", "missing", "docs/COMPATIBILITY.md"));
    }
  } catch {
    results.push(fail("protocol copy", "docs/COMPATIBILITY.md", "missing", "docs/COMPATIBILITY.md"));
  }
  for (const file of walk(root)) {
    const rel = file.slice(root.length + 1);
    results.push(...denyStale(readFileSync(file, "utf8"), rel));
  }
  const fails = results.filter((r) => r.status === "FAIL");
  const collapsed: Outcome[] = [];
  const seen = new Set<string>();
  for (const r of results) {
    if (r.status === "PASS") {
      if (seen.has(r.name)) continue;
      seen.add(r.name);
    }
    collapsed.push(r);
  }
  return { ok: fails.length === 0, results: collapsed };
}

export function formatReport(report: { ok: boolean; results: Outcome[] }): string {
  const lines: string[] = [];
  for (const r of report.results) {
    if (r.status === "PASS") {
      if (!lines.includes(`PASS ${r.name}`)) lines.push(`PASS ${r.name}`);
      continue;
    }
    lines.push(`FAIL ${r.name}`);
    if (r.surface) lines.push(`  surface: ${r.surface}`);
    if (r.expected) lines.push(`  expected: ${r.expected}`);
    if (r.actual) lines.push(`  actual: ${r.actual}`);
    if (r.url) lines.push(`  url: ${r.url}`);
  }
  lines.push(report.ok ? "OK" : "FAILED");
  return lines.join("\n");
}

async function fetchText(url: string): Promise<{ status: number; contentType: string; body: string; location: string | null }> {
  let response: Response;
  try {
    response = await fetch(url, { redirect: "manual" });
  } catch (error) {
    throw new Error(`NETWORK ${url}: ${error instanceof Error ? error.message : String(error)}`);
  }
  return {
    status: response.status,
    contentType: response.headers.get("content-type") ?? "",
    body: await response.text(),
    location: response.headers.get("location"),
  };
}

async function liveCheck(): Promise<{ ok: boolean; results: Outcome[] }> {
  const results: Outcome[] = [];
  const discoveryUrl = `${PUBLIC_TRUTH.api}/.well-known/fiscal402.json`;
  const openapiUrl = `${PUBLIC_TRUTH.api}/openapi.json`;
  const jwksUrl = `${PUBLIC_TRUTH.api}/.well-known/jwks.json`;
  const factsUrl = `${PUBLIC_TRUTH.website}/facts.json`;
  const llmsUrl = `${PUBLIC_TRUTH.website}/llms.txt`;
  const pricingPageUrl = `${PUBLIC_TRUTH.website}/pricing`;
  const legalPageUrl = `${PUBLIC_TRUTH.website}/legal`;
  const websiteUrl = `${PUBLIC_TRUTH.website}/`;
  const apexUrl = "https://fiscal402.com/";
  const mcpUrl = `${PUBLIC_TRUTH.api}/.well-known/mcp.json`;
  const capabilitiesUrl = `${PUBLIC_TRUTH.api}/v1/capabilities`;

  const discovery = await fetchText(discoveryUrl);
  if (discovery.status !== 200) results.push(fail("HTTP", "200", String(discovery.status), "discovery", discoveryUrl));
  if (!discovery.contentType.includes("application/json")) {
    results.push(fail("content-type", "application/json", discovery.contentType, "discovery", discoveryUrl));
  }
  results.push(...denyStale(discovery.body, "discovery"));
  const discoveryJson = JSON.parse(discovery.body) as Record<string, unknown>;
  if (discoveryJson.github === false) results.push(fail("GitHub", PUBLIC_TRUTH.github, "false", "discovery", discoveryUrl));
  const github = (discoveryJson.github as string | undefined) ?? (discoveryJson.documentation as { github?: string } | undefined)?.github;
  if (github && github !== PUBLIC_TRUTH.github) results.push(fail("GitHub", PUBLIC_TRUTH.github, github, "discovery", discoveryUrl));
  if (!github) results.push(fail("GitHub", PUBLIC_TRUTH.github, "missing", "discovery", discoveryUrl));
  else results.push(pass("GitHub"));
  const pricing = (discoveryJson.pricing as { production?: Record<string, unknown> } | undefined)?.production ?? {};
  if ("amount_usdc" in pricing) results.push(fail("pricing", "0/10 bps policy", `amount_usdc=${String(pricing.amount_usdc)}`, "discovery", discoveryUrl));

  const openapi = await fetchText(openapiUrl);
  const spec = JSON.parse(openapi.body) as { servers?: { url: string }[] };
  const server = spec.servers?.[0]?.url;
  if (server !== PUBLIC_TRUTH.api) results.push(fail("OpenAPI server", PUBLIC_TRUTH.api, String(server), "openapi", openapiUrl));
  else results.push(pass("OpenAPI server"));
  results.push(...denyStale(openapi.body, "openapi"));

  const jwks = await fetchText(jwksUrl);
  if (jwks.status !== 200) results.push(fail("JWKS", "200", String(jwks.status), "jwks", jwksUrl));
  const keys = (JSON.parse(jwks.body) as { keys?: unknown[] }).keys;
  if (!Array.isArray(keys) || keys.length === 0) results.push(fail("JWKS", "Ed25519 keys", "missing", "jwks", jwksUrl));
  else results.push(pass("JWKS"));
  if (/BEGIN PRIVATE KEY/.test(jwks.body)) results.push(fail("JWKS", "public keys only", "private material", "jwks", jwksUrl));

  const mcp = await fetchText(mcpUrl);
  if (mcp.status === 200) {
    results.push(...denyStale(mcp.body, "mcp"));
    if (!(/implemented|supported/i.test(mcp.body))) {
      results.push(fail("MCP status", "implemented", mcp.body.slice(0, 180), "mcp", mcpUrl));
    } else results.push(pass("MCP status"));
  }

  try {
    const facts = await fetchText(factsUrl);
    if (facts.status !== 200) results.push(fail("HTTP", "200", String(facts.status), "facts", factsUrl));
    else {
      if (!facts.contentType.includes("application/json")) {
        results.push(fail("content-type", "application/json", facts.contentType, "facts", factsUrl));
      }
      const json = JSON.parse(facts.body) as {
        pricing_beta?: { fee_bps: number };
        pricing_standard?: { fee_bps: number; display_rate: string };
        mcp?: unknown;
        github?: string;
        legal?: {
          statutory_name?: string;
          trade_name?: string;
          chamber_of_commerce?: string;
          vat_id?: string;
          identity_complete?: boolean;
        };
        production_jurisdictions?: string[];
        capability_matrix?: { id: string; status: string }[];
      };
      if (json.pricing_beta?.fee_bps !== PUBLIC_TRUTH.betaBps || json.pricing_standard?.fee_bps !== PUBLIC_TRUTH.standardBps) {
        results.push(fail("pricing", "beta 0 / standard 10", JSON.stringify({ beta: json.pricing_beta, standard: json.pricing_standard }), "facts", factsUrl));
      } else results.push(pass("pricing"));
      if (json.mcp !== true) results.push(fail("MCP status", "implemented", String(json.mcp), "facts", factsUrl));
      else results.push(pass("MCP status"));
      if (json.github !== PUBLIC_TRUTH.github) results.push(fail("GitHub", PUBLIC_TRUTH.github, String(json.github), "facts", factsUrl));
      const legal = json.legal;
      if (!legal || legal.trade_name !== PUBLIC_TRUTH.tradeName) {
        results.push(fail("legal identity", "trade_name=Fiscal402", JSON.stringify(legal), "facts", factsUrl));
      }
      if (
        !legal ||
        isLegalPlaceholder(legal.statutory_name) ||
        !/^\d{8}$/.test(legal.chamber_of_commerce ?? "") ||
        !/^NL\d{9}B\d{2}$/.test(legal.vat_id ?? "") ||
        legal.identity_complete !== true
      ) {
        results.push(
          fail(
            "legal identity",
            "statutory_name, 8-digit KvK, NL VAT ID, identity_complete=true",
            "placeholder or incomplete — do not publish invented KvK/VAT numbers",
            "facts",
            factsUrl,
          ),
        );
      } else results.push(pass("legal identity"));
      const production = json.production_jurisdictions ?? [];
      if (!production.includes("EU VAT") && !production.includes("EU-VAT")) {
        results.push(fail("capabilities", "EU VAT production", JSON.stringify(production), "facts", factsUrl));
      }
      const matrix = json.capability_matrix ?? [];
      for (const id of ["uk-vat-gb-gb-digital", "us-sales-tax", "ca-gst-hst-pst-qst", "receipt-v2", "npm-pypi-verifier"]) {
        const row = matrix.find((r) => r.id === id);
        if (row?.status === "production") {
          results.push(fail("capability matrix", `${id} not production`, row.status, "facts", factsUrl));
        }
      }
      results.push(...denyStale(facts.body, "facts"));
    }
  } catch (error) {
    results.push(fail("facts.json", "reachable", error instanceof Error ? error.message : String(error), "facts", factsUrl));
  }

  try {
    const llms = await fetchText(llmsUrl);
    if (llms.status !== 200) results.push(fail("HTTP", "200", String(llms.status), "llms", llmsUrl));
    else {
      const need = [/Fiscal402/, /x402/, /EU fiscal/i, /fiscal402\.receipt\/1\.0\.0/, /0 bps/i, /10 bps/, /0\.1%/, /trade name/i, /Fiscal402 is not x402/i];
      const missing = need.filter((re) => !re.test(llms.body));
      if (missing.length) results.push(fail("llms surfaces", "core facts", "missing required phrases", "llms", llmsUrl));
      else results.push(pass("llms surfaces"));
      results.push(...denyStale(llms.body, "llms"));
    }
  } catch (error) {
    results.push(fail("llms surfaces", "reachable", error instanceof Error ? error.message : String(error), "llms", llmsUrl));
  }

  try {
    const html = await fetchText(websiteUrl);
    if (html.status !== 200) results.push(fail("HTTP", "200", String(html.status), "website", websiteUrl));
    else {
      if (!/Fiscal402/.test(html.body) || !/autonomous commerce/i.test(html.body) || !(/0 bps/i.test(html.body) || /Free(?: during)? Beta/i.test(html.body))) {
        results.push(fail("human surface", "Fiscal402 / autonomous commerce / 0 bps", "missing", "website", websiteUrl));
      } else results.push(pass("human surface"));
      if (!/10 bps|0\.1%/.test(html.body)) {
        results.push(fail("pricing", "10 bps or 0.1%", "missing from homepage", "website", websiteUrl));
      }
      results.push(...denyStale(html.body, "website"));
    }
  } catch (error) {
    results.push(fail("human surface", "reachable", error instanceof Error ? error.message : String(error), "website", websiteUrl));
  }

  try {
    const pricingPage = await fetchText(pricingPageUrl);
    if (pricingPage.status === 200) {
      if (!/10 bps|0\.1%/.test(pricingPage.body)) {
        results.push(fail("pricing", "10 bps / 0.1% on /pricing", "missing", "pricing", pricingPageUrl));
      }
      results.push(...denyStale(pricingPage.body, "pricing"));
    } else {
      results.push(fail("HTTP", "200", String(pricingPage.status), "pricing", pricingPageUrl));
    }
  } catch (error) {
    results.push(fail("pricing", "reachable", error instanceof Error ? error.message : String(error), "pricing", pricingPageUrl));
  }

  try {
    const legalPage = await fetchText(legalPageUrl);
    if (legalPage.status !== 200) {
      results.push(fail("HTTP", "200", String(legalPage.status), "legal", legalPageUrl));
    } else {
      if (!/trade name/i.test(legalPage.body) || !/Fiscal402/.test(legalPage.body)) {
        results.push(fail("legal identity", "trade name Fiscal402 on /legal", "missing", "legal", legalPageUrl));
      } else results.push(pass("legal identity"));
      results.push(...denyStale(legalPage.body, "legal"));
    }
  } catch (error) {
    results.push(fail("legal identity", "reachable", error instanceof Error ? error.message : String(error), "legal", legalPageUrl));
  }

  try {
    const caps = await fetchText(capabilitiesUrl);
    if (caps.status === 200) {
      results.push(...denyStale(caps.body, "capabilities"));
      if (!/eu-vat|EU VAT|eu_vat/i.test(caps.body)) {
        results.push(fail("capabilities", "EU VAT in catalog", "missing", "capabilities", capabilitiesUrl));
      } else results.push(pass("capabilities"));
    }
  } catch (error) {
    results.push(fail("capabilities", "reachable", error instanceof Error ? error.message : String(error), "capabilities", capabilitiesUrl));
  }

  try {
    const apex = await fetchText(apexUrl);
    if (apex.status !== 301 && apex.status !== 308) {
      results.push(fail("apex redirect", "301 or 308", String(apex.status), "apex", apexUrl));
    } else if (!(apex.location ?? "").startsWith(PUBLIC_TRUTH.website)) {
      results.push(fail("apex redirect", PUBLIC_TRUTH.website, apex.location ?? "missing", "apex", apexUrl));
    } else results.push(pass("apex redirect"));
  } catch (error) {
    results.push(fail("apex redirect", "reachable", error instanceof Error ? error.message : String(error), "apex", apexUrl));
  }

  try {
    const receiptUrl = `${PUBLIC_TRUTH.website}/examples/verify/receipt.json`;
    const jwksExUrl = `${PUBLIC_TRUTH.website}/examples/verify/jwks.json`;
    const ublUrl = `${PUBLIC_TRUTH.website}/examples/verify/invoice.xml`;
    const receipt = await fetchText(receiptUrl);
    const receiptJson = JSON.parse(receipt.body) as { spec?: string; spec_version?: string };
    if (receiptJson.spec !== "fiscal402.receipt" || receiptJson.spec_version !== "1.0.0") {
      results.push(fail("evidence bundle", "fiscal402.receipt/1.0.0", JSON.stringify(receiptJson), "evidence", receiptUrl));
    } else {
      await fetchText(jwksExUrl);
      await fetchText(ublUrl);
      results.push(pass("evidence bundle"));
    }
  } catch (error) {
    results.push(fail("evidence bundle", "reachable example bundle", error instanceof Error ? error.message : String(error), "evidence"));
  }

  const fails = results.filter((r) => r.status === "FAIL");
  return { ok: fails.length === 0, results };
}

const live = process.argv.includes("--live");
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("check-public-contract.ts")) {
  const reportPromise = live ? liveCheck() : Promise.resolve(checkLocalDocs());
  reportPromise
    .then((report) => {
      process.stdout.write(`Fiscal402 public contract (${live ? "LIVE" : "LOCAL"})\n${formatReport(report)}\n`);
      process.exit(report.ok ? 0 : 1);
    })
    .catch((error) => {
      process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
      process.exit(1);
    });
}
