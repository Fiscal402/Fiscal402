export { Fiscal402Client } from "./client.js";
export { Fiscal402AuthError, Fiscal402Error, isFiscal402Error } from "./errors.js";
export { maskMerchantKey, redactSecrets } from "./redact.js";
export { resolveMerchantKey, resolveOrigin } from "./env.js";
export { DEFAULT_API_BASE, USER_AGENT, VERSION } from "./version.js";
export type {
  CapabilitiesDocument,
  CapabilityCheckRequest,
  Fiscal402ClientOptions,
  Fiscal402Receipt,
  FiscalBuyerInput,
  FiscalEventCreateInput,
  FiscalEventRecord,
  FiscalPartyInput,
  FiscalSupplyInput,
  Jwks,
  RequestOptions,
  SettlementCreateInput,
  SettlementRecord,
  VerifyReceiptInput,
  VerifyReport,
} from "./types.js";

export {
  parseReceipt,
  verifyFiscal402Receipt,
  verifyReceipt,
  outcomeOf,
} from "@fiscal402/verify";
