const MERCHANT_KEY = /f402m_[A-Za-z0-9_-]+/g;
const HEADER_NAME = /x-fiscal402-key/gi;

export function redactSecrets(value: string): string {
  return value
    .replace(MERCHANT_KEY, (match) => {
      if (match === "f402m_your_key_here") return match;
      const tail = match.slice(-4);
      return `f402m_****${tail}`;
    })
    .replace(HEADER_NAME, "X-Fiscal402-Key");
}

export function maskMerchantKey(key: string | undefined): string | undefined {
  if (!key) return undefined;
  if (key === "f402m_your_key_here") return key;
  if (key.startsWith("f402m_") && key.length > 10) {
    return `f402m_****${key.slice(-4)}`;
  }
  if (key.length <= 4) return "****";
  return `****${key.slice(-4)}`;
}
