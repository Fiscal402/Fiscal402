import type { Fiscal402Receipt, Jwks, VerifyReport } from "@fiscal402/verify";

export type { Fiscal402Receipt, Jwks, VerifyReport };

export type RequestOptions = {
  signal?: AbortSignal;
  timeoutMs?: number;
  idempotencyKey?: string;
  headers?: Record<string, string>;
};

export type Fiscal402ClientOptions = {
  /**
   * Merchant-scoped credential (`f402m_...`). Sent as X-Fiscal402-Key.
   * Server-side only. Never put this in NEXT_PUBLIC_*, VITE_*, or browser bundles.
   */
  apiKey?: string;
  /** API origin. Default https://api.fiscal402.com. Alias of `origin`. */
  baseUrl?: string;
  /** Alias for baseUrl. */
  origin?: string;
  fetch?: typeof fetch;
  timeoutMs?: number;
  userAgent?: string;
  /**
   * When true (default), authenticated writes still require an explicit merchant key.
   * Public discovery methods work without a key.
   */
  requireKeyOnAuth?: boolean;
};

export type SettlementCreateInput = {
  amountUsdc: string;
  txHash: string;
  timestamp: string;
  payerWallet: string;
  receiverWallet: string;
  network: string;
  asset?: string;
  scheme?: string;
  consumerCountry?: string;
  consumerVatNumber?: string;
  consumerName?: string;
  consumerStreet?: string;
  consumerCity?: string;
  consumerPostalZone?: string;
  resourceUrl?: string;
  amountAtomic?: string;
  decimals?: number;
  idempotencyKey?: string;
};

export type SettlementRecord = {
  id: string;
  createdAt?: string;
  custody?: string;
  reviewStatus?: string;
  event?: unknown;
  classification?: {
    regime?: string;
    taxCategoryCode?: string;
    ratePercent?: number;
    taxingCountry?: string;
    legalReference?: string;
    note?: string;
    vatCheck?: { viesError?: string; reviewStatus?: string };
  };
  fx?: unknown;
  ublPath?: string;
  [key: string]: unknown;
};

export type FiscalPartyInput = {
  legalName: string;
  country: string;
  vatNumber?: string;
  defaultSupplyKind?: string;
};

export type FiscalBuyerInput = {
  country?: string;
  vatNumber?: string;
  businessStatus?: "B2B" | "B2C" | "UNKNOWN";
};

export type FiscalSupplyInput = {
  kind: string;
  description?: string;
  resourceUrl?: string;
};

export type FiscalEventCreateInput = {
  payment: unknown;
  seller: FiscalPartyInput;
  buyer?: FiscalBuyerInput;
  supply: FiscalSupplyInput;
  idempotencyKey?: string;
};

export type FiscalEventRecord = {
  status?: string;
  event_id?: string;
  id?: string;
  jurisdiction_evaluations?: unknown;
  candidates?: unknown;
  place_of_supply?: unknown;
  receipt?: unknown;
  settlement?: SettlementRecord;
  reviewStatus?: string;
  classification?: SettlementRecord["classification"];
  ublPath?: string;
  [key: string]: unknown;
};

export type CapabilityCheckRequest = {
  protocol?: string;
  network?: string;
  asset?: string;
  payment?: {
    protocol?: string;
    network?: string;
    asset?: string;
  };
  seller_country?: string;
  buyer_country?: string;
  supply_type?: string;
  buyer_business_status?: "B2B" | "B2C" | "UNKNOWN";
  buyer_type?: "B2B" | "B2C" | "UNKNOWN";
};

export type CapabilitiesDocument = {
  protocol_version?: string;
  tax_ruleset_version?: string;
  custody?: string;
  capabilities?: string[];
  payment_protocols?: Record<string, unknown>;
  jurisdictions?: Record<string, unknown>;
  [key: string]: unknown;
};

export type VerifyReceiptInput = {
  receipt: Fiscal402Receipt | string;
  ubl?: string;
  jwks?: Jwks;
  publicPem?: string;
};
