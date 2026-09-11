/**
 * Receipt parse. Duplicate JSON keys are rejected when the input is text.
 * JavaScript JSON.parse keeps the last duplicate silently — that is unsafe
 * for a signed document, so we scan first.
 */

export type ParseFailureCode = "DUPLICATE_KEYS" | "NOT_JSON" | "NOT_OBJECT";

export class ReceiptParseError extends Error {
  readonly code: ParseFailureCode;
  constructor(code: ParseFailureCode, message?: string) {
    super(message ?? code);
    this.name = "ReceiptParseError";
    this.code = code;
  }
}

export function parseReceipt(input: unknown): Record<string, unknown> {
  if (typeof input === "string") {
    assertNoDuplicateKeys(input);
    let parsed: unknown;
    try {
      parsed = JSON.parse(input);
    } catch {
      throw new ReceiptParseError("NOT_JSON");
    }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new ReceiptParseError("NOT_OBJECT");
    }
    return parsed as Record<string, unknown>;
  }
  if (input && typeof input === "object" && !Array.isArray(input)) {
    return input as Record<string, unknown>;
  }
  throw new TypeError("receipt must be a JSON object or JSON string");
}

/**
 * Scan JSON text for duplicate object keys.
 * Strings, numbers, and escapes are skipped so keys inside values are ignored.
 */
export function assertNoDuplicateKeys(text: string): void {
  const keysStack: Array<Set<string>> = [];
  let i = 0;
  const n = text.length;
  let expectingKey = false;

  while (i < n) {
    const c = text[i];
    if (c === " " || c === "\t" || c === "\n" || c === "\r") {
      i += 1;
      continue;
    }
    if (c === "{") {
      keysStack.push(new Set());
      expectingKey = true;
      i += 1;
      continue;
    }
    if (c === "}") {
      keysStack.pop();
      expectingKey = false;
      i += 1;
      continue;
    }
    if (c === "[") {
      keysStack.push(null as unknown as Set<string>);
      expectingKey = false;
      i += 1;
      continue;
    }
    if (c === "]") {
      keysStack.pop();
      expectingKey = false;
      i += 1;
      continue;
    }
    if (c === ",") {
      const top = keysStack[keysStack.length - 1];
      expectingKey = top instanceof Set;
      i += 1;
      continue;
    }
    if (c === ":") {
      expectingKey = false;
      i += 1;
      continue;
    }
    if (c === "\"") {
      const { value, next } = readJsonString(text, i);
      if (expectingKey) {
        const top = keysStack[keysStack.length - 1];
        if (top instanceof Set) {
          if (top.has(value)) {
            throw new ReceiptParseError("DUPLICATE_KEYS", `duplicate key ${JSON.stringify(value)}`);
          }
          top.add(value);
        }
      }
      i = next;
      continue;
    }
    i += 1;
  }
}

function readJsonString(text: string, start: number): { value: string; next: number } {
  let i = start + 1;
  let out = "";
  while (i < text.length) {
    const c = text[i];
    if (c === "\"") return { value: out, next: i + 1 };
    if (c === "\\") {
      const n = text[i + 1];
      if (n === "u") {
        out += String.fromCharCode(parseInt(text.slice(i + 2, i + 6), 16));
        i += 6;
        continue;
      }
      const map: Record<string, string> = {
        "\"": "\"",
        "\\": "\\",
        "/": "/",
        b: "\b",
        f: "\f",
        n: "\n",
        r: "\r",
        t: "\t",
      };
      out += map[n ?? ""] ?? n ?? "";
      i += 2;
      continue;
    }
    out += c;
    i += 1;
  }
  throw new ReceiptParseError("NOT_JSON", "unterminated string");
}
