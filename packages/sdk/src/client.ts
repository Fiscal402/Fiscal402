import { verifyReceipt as verifyReceiptIntegrity } from "@fiscal402/verify";
import { resolveMerchantKey, resolveOrigin } from "./env.js";
import { Fiscal402Error } from "./errors.js";
import { Transport } from "./transport.js";
import type {
  CapabilitiesDocument,
  CapabilityCheckRequest,
  Fiscal402ClientOptions,
  Fiscal402Receipt,
  FiscalEventCreateInput,
  FiscalEventRecord,
  Jwks,
  RequestOptions,
  SettlementCreateInput,
  SettlementRecord,
  VerifyReceiptInput,
  VerifyReport,
} from "./types.js";
import { DEFAULT_API_BASE, USER_AGENT } from "./version.js";

function requireSettlementFields(input: SettlementCreateInput): void {
  if (
    !input.txHash ||
    !input.network ||
    !input.amountUsdc ||
    !input.timestamp ||
    !input.payerWallet ||
    !input.receiverWallet
  ) {
    throw new Fiscal402Error({
      status: 400,
      code: "INCOMPLETE_SETTLEMENT_EVIDENCE",
      message:
        "A raw transaction hash is not enough. Provide amountUsdc, txHash, timestamp, payerWallet, receiverWallet, and network.",
    });
  }
}

export class Fiscal402Client {
  readonly baseUrl: string;
  private readonly transport: Transport;
  private readonly apiKey?: string;

  constructor(options: Fiscal402ClientOptions = {}) {
    this.apiKey = resolveMerchantKey(options.apiKey);
    this.baseUrl = resolveOrigin(options.baseUrl ?? options.origin ?? DEFAULT_API_BASE);
    this.transport = new Transport({
      baseUrl: this.baseUrl,
      apiKey: this.apiKey,
      fetchImpl: options.fetch ?? fetch,
      timeoutMs: options.timeoutMs ?? 30_000,
      userAgent: options.userAgent ?? USER_AGENT,
    });
  }

  readonly settlements = {
    create: async (
      input: SettlementCreateInput,
      options?: RequestOptions,
    ): Promise<SettlementRecord> => {
      requireSettlementFields(input);
      const { idempotencyKey, ...body } = input;
      return this.transport.request<SettlementRecord>({
        method: "POST",
        path: "/settlements",
        body,
        options: { ...options, idempotencyKey: options?.idempotencyKey ?? idempotencyKey },
      });
    },
    get: (id: string, options?: RequestOptions): Promise<SettlementRecord> => {
      return this.transport.request<SettlementRecord>({
        method: "GET",
        path: `/settlements/${encodeURIComponent(id)}`,
        options,
      });
    },
    list: (query?: { reviewStatus?: string }, options?: RequestOptions): Promise<SettlementRecord[]> => {
      const search = query?.reviewStatus
        ? `?reviewStatus=${encodeURIComponent(query.reviewStatus)}`
        : "";
      return this.transport.request<SettlementRecord[]>({
        method: "GET",
        path: `/settlements${search}`,
        options,
      });
    },
    getUbl: (id: string, options?: RequestOptions): Promise<string> => {
      return this.transport.request<string>({
        method: "GET",
        path: `/settlements/${encodeURIComponent(id)}/ubl`,
        accept: "text",
        options,
      });
    },
  };

  readonly receipts = {
    get: (id: string, options?: RequestOptions): Promise<Fiscal402Receipt> => {
      return this.transport.request<Fiscal402Receipt>({
        method: "GET",
        path: `/v1/receipts/${encodeURIComponent(id)}`,
        options,
      });
    },
    verify: async (input: VerifyReceiptInput): Promise<VerifyReport> => {
      const receipt =
        typeof input.receipt === "string"
          ? (JSON.parse(input.receipt) as Fiscal402Receipt)
          : input.receipt;
      return verifyReceiptIntegrity({
        receipt,
        ...(input.ubl ? { ubl: input.ubl } : {}),
        ...(input.jwks ? { jwks: input.jwks } : {}),
        ...(input.publicPem ? { publicPem: input.publicPem } : {}),
      });
    },
  };

  readonly capabilities = {
    get: (options?: RequestOptions): Promise<CapabilitiesDocument> => {
      return this.transport.request<CapabilitiesDocument>({
        method: "GET",
        path: "/v1/capabilities",
        auth: false,
        options,
      });
    },
    check: (query: CapabilityCheckRequest, options?: RequestOptions): Promise<unknown> => {
      return this.transport.request({
        method: "POST",
        path: "/v1/capabilities/check",
        body: query,
        auth: false,
        options,
      });
    },
  };

  readonly fiscalEvents = {
    create: (input: FiscalEventCreateInput, options?: RequestOptions): Promise<FiscalEventRecord> => {
      const { idempotencyKey, ...body } = input;
      return this.transport.request<FiscalEventRecord>({
        method: "POST",
        path: "/v1/fiscal-events",
        body,
        options: { ...options, idempotencyKey: options?.idempotencyKey ?? idempotencyKey },
      });
    },
    get: (id: string, options?: RequestOptions): Promise<FiscalEventRecord> => {
      return this.transport.request<FiscalEventRecord>({
        method: "GET",
        path: `/v1/fiscal-events/${encodeURIComponent(id)}`,
        options,
      });
    },
    list: (options?: RequestOptions): Promise<FiscalEventRecord[] | unknown> => {
      return this.transport.request({
        method: "GET",
        path: "/v1/fiscal-events",
        options,
      });
    },
  };

  readonly jwks = {
    get: (options?: RequestOptions): Promise<Jwks> => {
      return this.transport.request<Jwks>({
        method: "GET",
        path: "/.well-known/jwks.json",
        auth: false,
        options,
      });
    },
  };
}
