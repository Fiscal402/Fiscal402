/** Integer-string money / rate checks. No floats. */

const INTEGER = /^(0|[1-9][0-9]*)$/;

export function isIntegerString(value: unknown, maxDigits = 78): boolean {
  return typeof value === "string" && INTEGER.test(value) && value.length <= maxDigits;
}

export function isPositiveDenominator(value: unknown): boolean {
  return typeof value === "string" && /^[1-9][0-9]*$/.test(value) && value.length <= 78;
}

export function isMoney(value: unknown): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const rec = value as Record<string, unknown>;
  if (!/^[A-Z]{3}$/.test(String(rec.currency ?? ""))) return false;
  if (!isIntegerString(rec.amount_minor)) return false;
  if (typeof rec.minor_unit !== "number" || !Number.isInteger(rec.minor_unit)) return false;
  if (rec.minor_unit < 0 || rec.minor_unit > 18) return false;
  return true;
}

export function isRate(value: unknown): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const rec = value as Record<string, unknown>;
  return isIntegerString(rec.numerator) && isPositiveDenominator(rec.denominator);
}

export function isRfc3339Utc(value: unknown): boolean {
  return typeof value === "string" && /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\.[0-9]{1,9})?Z$/.test(value);
}

export function isSha256Hex(value: unknown): boolean {
  return typeof value === "string" && /^[0-9a-f]{64}$/.test(value);
}
