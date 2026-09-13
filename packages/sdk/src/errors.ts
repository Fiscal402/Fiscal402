import { redactSecrets } from "./redact.js";

export class Fiscal402Error extends Error {
  override readonly name: string = "Fiscal402Error";
  readonly status: number;
  readonly code: string;
  readonly requestId?: string;
  readonly details?: unknown;
  readonly retryable: boolean;
  readonly path?: string;

  constructor(input: {
    status: number;
    code: string;
    message: string;
    requestId?: string;
    details?: unknown;
    retryable?: boolean;
    path?: string;
  }) {
    super(redactSecrets(input.message));
    this.status = input.status;
    this.code = input.code;
    this.requestId = input.requestId;
    this.details = input.details;
    this.retryable = Boolean(input.retryable);
    this.path = input.path;
  }
}

export class Fiscal402AuthError extends Fiscal402Error {
  override readonly name = "Fiscal402AuthError";
}

export function isFiscal402Error(error: unknown): error is Fiscal402Error {
  return error instanceof Fiscal402Error;
}

export function errorFromStatus(status: number, fallbackCode: string): string {
  switch (status) {
    case 400:
      return "BAD_REQUEST";
    case 401:
      return "UNAUTHORIZED";
    case 403:
      return "FORBIDDEN";
    case 404:
      return "NOT_FOUND";
    case 409:
      return "CONFLICT";
    case 413:
      return "PAYLOAD_TOO_LARGE";
    case 422:
      return "UNPROCESSABLE_ENTITY";
    case 429:
      return "RATE_LIMITED";
    default:
      if (status >= 500) return "SERVER_ERROR";
      return fallbackCode;
  }
}

export function isRetryableStatus(status: number): boolean {
  return status === 429 || status >= 500;
}
