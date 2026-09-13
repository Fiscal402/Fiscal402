/**
 * Server-side Fiscal402 client for Node.js.
 * Merchant credentials must stay on the server. Do not use this package in the browser.
 */
import {
  Fiscal402AuthError,
  Fiscal402Client,
  VERSION,
  resolveMerchantKey,
  type Fiscal402ClientOptions,
  type FiscalEventCreateInput,
  type RequestOptions,
  type SettlementCreateInput,
  type VerifyReceiptInput,
} from "@fiscal402/sdk";

export {
  Fiscal402AuthError,
  Fiscal402Client,
  Fiscal402Error,
  DEFAULT_API_BASE,
  VERSION,
  verifyReceipt,
  verifyFiscal402Receipt,
  type Fiscal402Receipt,
  type Jwks,
  type SettlementCreateInput,
  type SettlementRecord,
  type VerifyReport,
} from "@fiscal402/sdk";

export type Fiscal402Options = Fiscal402ClientOptions;

const NODE_UA = `fiscal402-node/${VERSION}`;

export class Fiscal402 {
  readonly client: Fiscal402Client;

  /**
   * @param options.apiKey Merchant-scoped `f402m_...` credential. Server-side only.
   *   Defaults to process.env.FISCAL402_MERCHANT_KEY.
   */
  constructor(options: Fiscal402Options = {}) {
    const apiKey = resolveMerchantKey(options.apiKey);
    if (!apiKey) {
      throw new Fiscal402AuthError({
        status: 401,
        code: "MISSING_API_KEY",
        message:
          "Missing FISCAL402_MERCHANT_KEY. Merchant credentials are server-side only and must use the f402m_ prefix.",
      });
    }
    this.client = new Fiscal402Client({
      ...options,
      apiKey,
      userAgent: options.userAgent ?? NODE_UA,
    });
  }

  /** Production x402 ingest: POST /settlements. */
  processSettlement(input: SettlementCreateInput, options?: RequestOptions) {
    return this.client.settlements.create(input, options);
  }

  /**
   * Normalized fiscal-event ingest: POST /v1/fiscal-events.
   * Use when you have attested seller/buyer/supply context in addition to payment evidence.
   */
  process(input: FiscalEventCreateInput, options?: RequestOptions) {
    return this.client.fiscalEvents.create(input, options);
  }

  getSettlement(id: string, options?: RequestOptions) {
    return this.client.settlements.get(id, options);
  }

  getUbl(id: string, options?: RequestOptions) {
    return this.client.settlements.getUbl(id, options);
  }

  getReceipt(id: string, options?: RequestOptions) {
    return this.client.receipts.get(id, options);
  }

  verifyReceipt(input: VerifyReceiptInput) {
    return this.client.receipts.verify(input);
  }

  getCapabilities(options?: RequestOptions) {
    return this.client.capabilities.get(options);
  }

  checkCapabilities(
    query: Parameters<Fiscal402Client["capabilities"]["check"]>[0],
    options?: RequestOptions,
  ) {
    return this.client.capabilities.check(query, options);
  }

  getJwks(options?: RequestOptions) {
    return this.client.jwks.get(options);
  }
}

export { NODE_UA as USER_AGENT };
