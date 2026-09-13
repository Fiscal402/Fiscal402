import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  Fiscal402AuthError,
  Fiscal402Client,
  Fiscal402Error,
  USER_AGENT,
  type SettlementCreateInput,
} from "../dist/index.js";

const settlement: SettlementCreateInput = {
  amountUsdc: "1.00",
  txHash: "0x4f9c1670ca4418548266925643679b60b2f54e06f0c6527908e945e55cfafd8e",
  timestamp: "2026-09-10T12:00:00.000Z",
  payerWallet: "0xpayer",
  receiverWallet: "0xrecv",
  network: "eip155:1",
  asset: "USDC",
  scheme: "exact",
  consumerCountry: "DE",
  idempotencyKey: "acme-nl-de-1",
};

type Handler = (url: URL, init?: RequestInit) => Response | Promise<Response>;

function mockFetch(routes: Record<string, Handler>): typeof fetch {
  return (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input));
    const key = `${(init?.method ?? "GET").toUpperCase()} ${url.pathname}`;
    const handler = routes[key];
    if (!handler) return new Response(`unhandled ${key}`, { status: 599 });
    return handler(url, init);
  }) as typeof fetch;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("Fiscal402Client", () => {
  it("POSTs /settlements with X-Fiscal402-Key and Idempotency-Key", async () => {
    let captured: RequestInit | undefined;
    const client = new Fiscal402Client({
      apiKey: "f402m_testkey0001",
      fetch: mockFetch({
        "POST /settlements": (_url, init) => {
          captured = init;
          return json({ id: "x402-test", custody: "none", reviewStatus: "PROCESSED" }, 201);
        },
      }),
    });
    const record = await client.settlements.create(settlement);
    assert.equal(record.id, "x402-test");
    const headers = new Headers(captured?.headers);
    assert.equal(headers.get("x-fiscal402-key"), "f402m_testkey0001");
    assert.equal(headers.get("idempotency-key"), "acme-nl-de-1");
    assert.equal(headers.get("user-agent"), USER_AGENT);
    const body = JSON.parse(String(captured?.body)) as { txHash: string; idempotencyKey?: string };
    assert.equal(body.txHash, settlement.txHash);
    assert.equal(body.idempotencyKey, undefined);
  });

  it("rejects a tx-hash-only settlement before HTTP", async () => {
    let called = false;
    const client = new Fiscal402Client({
      apiKey: "f402m_testkey0001",
      fetch: (async () => {
        called = true;
        return new Response("no", { status: 599 });
      }) as typeof fetch,
    });
    await assert.rejects(
      () =>
        client.settlements.create({
          amountUsdc: "",
          txHash: "0xabc",
          timestamp: "",
          payerWallet: "",
          receiverWallet: "",
          network: "",
        }),
      Fiscal402Error,
    );
    assert.equal(called, false);
  });

  it("GETs capabilities without a merchant key", async () => {
    const client = new Fiscal402Client({
      fetch: mockFetch({
        "GET /v1/capabilities": () => json({ protocol_version: "0.3.0", custody: "none" }),
      }),
    });
    const doc = await client.capabilities.get();
    assert.equal(doc.protocol_version, "0.3.0");
  });

  it("POSTs /v1/capabilities/check without a key", async () => {
    const client = new Fiscal402Client({
      fetch: mockFetch({
        "POST /v1/capabilities/check": () => json({ overall: "SUPPORTED" }),
      }),
    });
    const result = (await client.capabilities.check({
      protocol: "x402",
      network: "eip155:1",
      asset: "USDC",
      seller_country: "NL",
      buyer_country: "DE",
    })) as { overall: string };
    assert.equal(result.overall, "SUPPORTED");
  });

  it("authenticated GET without a key throws MISSING_API_KEY", async () => {
    const client = new Fiscal402Client({
      fetch: mockFetch({
        "GET /settlements/x": () => json({ id: "x" }),
      }),
    });
    await assert.rejects(() => client.settlements.get("x"), (err: unknown) => {
      assert.ok(err instanceof Fiscal402AuthError);
      assert.equal(err.code, "MISSING_API_KEY");
      return true;
    });
  });

  it("maps 401 to Fiscal402AuthError", async () => {
    const client = new Fiscal402Client({
      apiKey: "f402m_bad",
      fetch: mockFetch({
        "GET /v1/receipts/rcpt_x": () =>
          json({ error: { code: "UNAUTHORIZED", message: "invalid key", request_id: "req_1" } }, 401),
      }),
    });
    await assert.rejects(() => client.receipts.get("rcpt_x"), (err: unknown) => {
      assert.ok(err instanceof Fiscal402AuthError);
      assert.equal(err.status, 401);
      assert.equal(err.requestId, "req_1");
      return true;
    });
  });

  it("retries GET on 503 then succeeds", async () => {
    let calls = 0;
    const client = new Fiscal402Client({
      apiKey: "f402m_testkey0001",
      fetch: mockFetch({
        "GET /settlements/x": () => {
          calls += 1;
          if (calls === 1) return json({ error: { code: "SERVER_ERROR", message: "down" } }, 503);
          return json({ id: "x" });
        },
      }),
    });
    const record = await client.settlements.get("x");
    assert.equal(record.id, "x");
    assert.equal(calls, 2);
  });

  it("does not retry POST", async () => {
    let calls = 0;
    const client = new Fiscal402Client({
      apiKey: "f402m_testkey0001",
      fetch: mockFetch({
        "POST /settlements": () => {
          calls += 1;
          return json({ error: { code: "SERVER_ERROR", message: "down" } }, 503);
        },
      }),
    });
    await assert.rejects(() => client.settlements.create(settlement), Fiscal402Error);
    assert.equal(calls, 1);
  });

  it("creates a normalized fiscal event", async () => {
    const client = new Fiscal402Client({
      apiKey: "f402m_testkey0001",
      fetch: mockFetch({
        "POST /v1/fiscal-events": () => json({ status: "DETERMINED", event_id: "evt_1" }, 201),
      }),
    });
    const result = await client.fiscalEvents.create({
      payment: settlement,
      seller: { legalName: "Example B.V.", country: "NL" },
      buyer: { country: "DE" },
      supply: { kind: "digital_service" },
    });
    assert.equal(result.event_id, "evt_1");
  });
});
