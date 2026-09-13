import {
  errorFromStatus,
  Fiscal402AuthError,
  Fiscal402Error,
  isRetryableStatus,
} from "./errors.js";
import { redactSecrets } from "./redact.js";
import type { RequestOptions } from "./types.js";
import { USER_AGENT } from "./version.js";

export type TransportOptions = {
  baseUrl: string;
  apiKey?: string;
  fetchImpl: typeof fetch;
  timeoutMs: number;
  userAgent: string;
};

type InternalRequest = {
  method: string;
  path: string;
  body?: unknown;
  auth?: boolean;
  accept?: "json" | "text";
  options?: RequestOptions;
};

const GET_RETRY_LIMIT = 2;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function mergeSignals(timeoutMs: number, user?: AbortSignal): { signal: AbortSignal; cancel: () => void } {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const onAbort = () => controller.abort();
  if (user) {
    if (user.aborted) controller.abort();
    else user.addEventListener("abort", onAbort, { once: true });
  }
  return {
    signal: controller.signal,
    cancel: () => {
      clearTimeout(timer);
      if (user) user.removeEventListener("abort", onAbort);
    },
  };
}

function parseErrorPayload(text: string): {
  code?: string;
  message?: string;
  requestId?: string;
  details?: unknown;
} {
  try {
    const parsed = JSON.parse(text) as {
      error?: string | { code?: string; message?: string; request_id?: string };
      code?: string;
      detail?: string;
      message?: string;
      request_id?: string;
    };
    if (typeof parsed.error === "string") {
      return {
        code: parsed.code ?? parsed.error,
        message: parsed.detail ?? parsed.message ?? parsed.error,
        requestId: parsed.request_id,
        details: parsed,
      };
    }
    if (parsed.error && typeof parsed.error === "object") {
      return {
        code: parsed.error.code,
        message: parsed.error.message,
        requestId: parsed.error.request_id ?? parsed.request_id,
        details: parsed,
      };
    }
  } catch {
    /* plain text body */
  }
  return { message: text ? redactSecrets(text).slice(0, 240) : undefined };
}

export class Transport {
  constructor(private readonly options: TransportOptions) {}

  async request<T>(input: InternalRequest): Promise<T> {
    const method = input.method.toUpperCase();
    const auth = input.auth !== false;
    if (auth && !this.options.apiKey) {
      throw new Fiscal402AuthError({
        status: 401,
        code: "MISSING_API_KEY",
        message:
          "Missing merchant-scoped key. Set FISCAL402_MERCHANT_KEY or pass apiKey. Server-side only.",
        path: input.path,
      });
    }

    const attempts = method === "GET" ? GET_RETRY_LIMIT + 1 : 1;
    let lastError: unknown;
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      try {
        return await this.once<T>(input, method, auth);
      } catch (error) {
        lastError = error;
        const retryable =
          error instanceof Fiscal402Error && error.retryable && method === "GET";
        if (!retryable || attempt === attempts - 1) throw error;
        await sleep(200 * 2 ** attempt);
      }
    }
    throw lastError;
  }

  private async once<T>(input: InternalRequest, method: string, auth: boolean): Promise<T> {
    const headers: Record<string, string> = {
      accept: input.accept === "text" ? "application/xml, text/plain, */*" : "application/json",
      "user-agent": this.options.userAgent || USER_AGENT,
    };
    if (auth && this.options.apiKey) headers["x-fiscal402-key"] = this.options.apiKey;
    if (input.body !== undefined) headers["content-type"] = "application/json";
    const idempotency = input.options?.idempotencyKey;
    if (idempotency) headers["idempotency-key"] = idempotency;
    if (input.options?.headers) {
      for (const [key, value] of Object.entries(input.options.headers)) {
        const lower = key.toLowerCase();
        if (lower === "x-fiscal402-key") continue;
        headers[key] = value;
      }
    }

    const timeoutMs = input.options?.timeoutMs ?? this.options.timeoutMs;
    const { signal, cancel } = mergeSignals(timeoutMs, input.options?.signal);
    let res: Response;
    try {
      res = await this.options.fetchImpl(`${this.options.baseUrl}${input.path}`, {
        method,
        headers,
        signal,
        ...(input.body === undefined ? {} : { body: JSON.stringify(input.body) }),
      });
    } catch (error) {
      cancel();
      if (signal.aborted) {
        throw new Fiscal402Error({
          status: 0,
          code: "TIMEOUT",
          message: "request aborted or timed out",
          retryable: true,
          path: input.path,
        });
      }
      const message = error instanceof Error ? error.message : "network_error";
      throw new Fiscal402Error({
        status: 0,
        code: "NETWORK_ERROR",
        message: redactSecrets(message),
        retryable: true,
        path: input.path,
      });
    }
    cancel();

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      const parsed = parseErrorPayload(text);
      const code = parsed.code ?? errorFromStatus(res.status, `HTTP_${res.status}`);
      const Ctor = res.status === 401 || res.status === 403 ? Fiscal402AuthError : Fiscal402Error;
      throw new Ctor({
        status: res.status,
        code,
        message: parsed.message ?? `${method} ${input.path}`,
        requestId: parsed.requestId ?? res.headers.get("x-request-id") ?? undefined,
        details: parsed.details,
        retryable: isRetryableStatus(res.status),
        path: input.path,
      });
    }

    if (input.accept === "text") {
      return (await res.text()) as T;
    }
    if (res.status === 204) return undefined as T;
    const contentType = res.headers.get("content-type") ?? "";
    if (contentType.includes("json")) {
      return (await res.json()) as T;
    }
    return (await res.text()) as T;
  }
}
