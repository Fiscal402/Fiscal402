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
} as const;

export const STALE = ["0.01 USDC", "x402-lhrtxg.fly.dev", "grok.me"] as const;

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

export function denyStale(text: string, surface: string): Outcome[] {
  const hits: Outcome[] = [];
  for (const stale of STALE) {
    if (text.includes(stale)) hits.push(fail("stale public values", `absent ${stale}`, `present in ${surface}`, surface));
  }
  if (/["']github["']\s*:\s*false/.test(text)) hits.push(fail("GitHub", PUBLIC_TRUTH.github, "github: false", surface));
  if (/["']mcp["']\s*:\s*true/.test(text)) hits.push(fail("MCP status", "not implemented", "mcp: true", surface));
  return hits.length ? hits : [pass("stale public values")];
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
  if (/npx fiscal402-verify/.test(readme) && /not published to npm yet/i.test(readme) === false) {
    results.push(fail("npm", "source-only verifier", "npx implies published", "README.md"));
  } else results.push(pass("npm"));
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
  const websiteUrl = `${PUBLIC_TRUTH.website}/`;
  const apexUrl = "https://fiscal402.com/";
  const mcpUrl = `${PUBLIC_TRUTH.api}/.well-known/mcp.json`;

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
  const mcpField = discoveryJson.mcp;
  if (mcpField === true || (typeof mcpField === "string" && mcpField.startsWith("http"))) {
    results.push(fail("MCP status", "not implemented", String(mcpField), "discovery", discoveryUrl));
  }

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
    if (/"status"\s*:\s*"supported"/.test(mcp.body) || /"mcp"\s*:\s*true/.test(mcp.body)) {
      results.push(fail("MCP status", "not implemented", mcp.body.slice(0, 180), "mcp", mcpUrl));
    }
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
      };
      if (json.pricing_beta?.fee_bps !== 0 || json.pricing_standard?.fee_bps !== 10) {
        results.push(fail("pricing", "beta 0 / standard 10", JSON.stringify({ beta: json.pricing_beta, standard: json.pricing_standard }), "facts", factsUrl));
      } else results.push(pass("pricing"));
      if (json.mcp === true) results.push(fail("MCP status", "not implemented", "true", "facts", factsUrl));
      else results.push(pass("MCP status"));
      if (json.github !== PUBLIC_TRUTH.github) results.push(fail("GitHub", PUBLIC_TRUTH.github, String(json.github), "facts", factsUrl));
    }
  } catch (error) {
    results.push(fail("facts.json", "reachable", error instanceof Error ? error.message : String(error), "facts", factsUrl));
  }

  try {
    const llms = await fetchText(llmsUrl);
    if (llms.status !== 200) results.push(fail("HTTP", "200", String(llms.status), "llms", llmsUrl));
    else {
      const need = [/Fiscal402/, /x402/, /EU fiscal/i, /fiscal402\.receipt\/1\.0\.0/, /0 bps/i, /10 bps/, /MPP.{0,24}not implemented/i, /AP2.{0,24}not implemented/i];
      const missing = need.filter((re) => !re.test(llms.body));
      if (missing.length) results.push(fail("llms surfaces", "core facts", "missing required phrases", "llms", llmsUrl));
      else results.push(pass("llms surfaces"));
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
    }
  } catch (error) {
    results.push(fail("human surface", "reachable", error instanceof Error ? error.message : String(error), "website", websiteUrl));
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
