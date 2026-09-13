/**
 * Merchant credentials are server-side only.
 * Do not read NEXT_PUBLIC_*, VITE_*, or PUBLIC_* variables.
 */
const PUBLIC_PREFIXES = ["NEXT_PUBLIC_", "VITE_", "PUBLIC_"];

export function readEnv(name: string): string | undefined {
  if (PUBLIC_PREFIXES.some((prefix) => name.startsWith(prefix))) return undefined;
  const value = typeof process !== "undefined" ? process.env[name] : undefined;
  return value && value.length > 0 ? value : undefined;
}

function merchantShaped(value: string | undefined): string | undefined {
  if (!value) return undefined;
  return value.startsWith("f402m_") ? value : undefined;
}

/**
 * Resolve the merchant-scoped credential.
 * Public name: FISCAL402_MERCHANT_KEY.
 * FISCAL402_KEY is accepted only when it already has the f402m_ prefix.
 * Operator env names are never used as a customer credential.
 */
export function resolveMerchantKey(explicit?: string): string | undefined {
  return explicit || readEnv("FISCAL402_MERCHANT_KEY") || merchantShaped(readEnv("FISCAL402_KEY"));
}

export function resolveOrigin(explicit?: string): string {
  const raw = explicit || readEnv("FISCAL402_ORIGIN") || "https://api.fiscal402.com";
  return raw.replace(/\/+$/, "");
}
