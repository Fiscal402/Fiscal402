export type CliCommand =
  | { name: "help" }
  | { name: "version" }
  | { name: "capabilities"; json: boolean; debug: boolean; origin?: string }
  | {
      name: "capabilities-check";
      json: boolean;
      debug: boolean;
      origin?: string;
      protocol?: string;
      network?: string;
      asset?: string;
      sellerCountry?: string;
      buyerCountry?: string;
      supplyType?: string;
      buyerType?: "B2B" | "B2C" | "UNKNOWN";
    }
  | { name: "receipts-verify"; receipt: string; ubl?: string; jwks?: string; json: boolean; debug: boolean }
  | { name: "receipts-get"; id: string; json: boolean; debug: boolean; origin?: string }
  | { name: "settlements-get"; id: string; json: boolean; debug: boolean; origin?: string }
  | { name: "settlements-create"; file: string; json: boolean; debug: boolean; origin?: string }
  | { name: "jwks"; json: boolean; debug: boolean; origin?: string }
  | { name: "unknown"; raw: string };

function flag(args: string[], name: string): boolean {
  return args.includes(name);
}

function value(args: string[], name: string): string | undefined {
  const i = args.indexOf(name);
  if (i >= 0 && args[i + 1] && !args[i + 1]!.startsWith("-")) return args[i + 1];
  const prefix = `${name}=`;
  const hit = args.find((a) => a.startsWith(prefix));
  return hit ? hit.slice(prefix.length) : undefined;
}

function takeFlags(args: string[]): {
  json: boolean;
  debug: boolean;
  origin?: string;
  rest: string[];
} {
  const origin = value(args, "--origin") ?? value(args, "--base-url");
  return {
    json: flag(args, "--json"),
    debug: flag(args, "--debug"),
    ...(origin ? { origin } : {}),
    rest: args.filter(
      (a, i, all) =>
        a !== "--json" &&
        a !== "--debug" &&
        a !== "--origin" &&
        a !== "--base-url" &&
        all[i - 1] !== "--origin" &&
        all[i - 1] !== "--base-url" &&
        !a.startsWith("--origin=") &&
        !a.startsWith("--base-url="),
    ),
  };
}

export function parseArgv(argv: string[]): CliCommand {
  const raw = argv.filter((a) => a.length > 0);
  if (raw.length === 0 || raw[0] === "help" || raw[0] === "--help" || raw[0] === "-h") {
    return { name: "help" };
  }
  if (raw[0] === "version" || raw[0] === "--version" || raw[0] === "-v") {
    return { name: "version" };
  }
  const { json, debug, origin, rest } = takeFlags(raw);
  const [cmd, sub, ...tail] = rest;
  if (cmd === "capabilities" && (sub === undefined || sub === "get")) {
    return { name: "capabilities", json, debug, ...(origin ? { origin } : {}) };
  }
  if (cmd === "capabilities" && sub === "check") {
    const args = [sub, ...tail];
    const buyerType = value(args, "--buyer-type") ?? value(args, "--buyer-business-status");
    return {
      name: "capabilities-check",
      json,
      debug,
      ...(origin ? { origin } : {}),
      ...(value(args, "--protocol") ? { protocol: value(args, "--protocol") } : {}),
      ...(value(args, "--network") ? { network: value(args, "--network") } : {}),
      ...(value(args, "--asset") ? { asset: value(args, "--asset") } : {}),
      ...(value(args, "--seller-country") ? { sellerCountry: value(args, "--seller-country") } : {}),
      ...(value(args, "--buyer-country") ? { buyerCountry: value(args, "--buyer-country") } : {}),
      ...(value(args, "--supply-type") ? { supplyType: value(args, "--supply-type") } : {}),
      ...(buyerType === "B2B" || buyerType === "B2C" || buyerType === "UNKNOWN"
        ? { buyerType }
        : {}),
    };
  }
  if (cmd === "receipts" && sub === "verify") {
    const receipt = tail.find((a) => !a.startsWith("-"));
    if (!receipt) return { name: "unknown", raw: rest.join(" ") };
    const ubl = value(tail, "--ubl");
    const jwks = value(tail, "--jwks");
    return {
      name: "receipts-verify",
      receipt,
      json,
      debug,
      ...(ubl ? { ubl } : {}),
      ...(jwks ? { jwks } : {}),
    };
  }
  if (cmd === "receipts" && sub === "get" && tail[0]) {
    return { name: "receipts-get", id: tail[0], json, debug, ...(origin ? { origin } : {}) };
  }
  if (cmd === "settlements" && sub === "get" && tail[0]) {
    return { name: "settlements-get", id: tail[0], json, debug, ...(origin ? { origin } : {}) };
  }
  if (cmd === "settlements" && sub === "create") {
    const file = value(tail, "--file") ?? tail.find((a) => !a.startsWith("-"));
    if (!file) return { name: "unknown", raw: rest.join(" ") };
    return { name: "settlements-create", file, json, debug, ...(origin ? { origin } : {}) };
  }
  if (cmd === "jwks") {
    return { name: "jwks", json, debug, ...(origin ? { origin } : {}) };
  }
  return { name: "unknown", raw: rest.join(" ") };
}

export const HELP = `fiscal402 — Fiscal402 developer CLI

Usage:
  fiscal402 --help
  fiscal402 --version
  fiscal402 capabilities [--json]
  fiscal402 capabilities check [--protocol x402] [--network eip155:1] [--asset USDC]
                               [--seller-country NL] [--buyer-country DE] [--json]
  fiscal402 receipts verify <receipt.json> [--ubl invoice.xml] [--jwks jwks.json] [--json]
  fiscal402 receipts get <id> [--json]
  fiscal402 settlements get <id> [--json]
  fiscal402 settlements create --file body.json [--json]
  fiscal402 jwks [--json]

Environment:
  FISCAL402_MERCHANT_KEY   merchant-scoped f402m_... credential (server-side)
  FISCAL402_ORIGIN         API origin, default https://api.fiscal402.com

Do not pass secrets as command-line arguments. They leak into shell history.

Exit codes:
  0  success
  1  request or verification failure
  2  invalid invocation

--debug prints diagnostics with secrets redacted. Stack traces stay off unless --debug.
`;
