import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { Fiscal402, Fiscal402AuthError, Fiscal402Error } from "../dist/index.js";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("@fiscal402/node", () => {
  it("requires a merchant key", () => {
    const prev = process.env.FISCAL402_MERCHANT_KEY;
    const prevKey = process.env.FISCAL402_KEY;
    delete process.env.FISCAL402_MERCHANT_KEY;
    delete process.env.FISCAL402_KEY;
    try {
      assert.throws(() => new Fiscal402(), Fiscal402AuthError);
    } finally {
      if (prev !== undefined) process.env.FISCAL402_MERCHANT_KEY = prev;
      if (prevKey !== undefined) process.env.FISCAL402_KEY = prevKey;
    }
  });

  it("processSettlement posts /settlements", async () => {
    let path = "";
    const fiscal = new Fiscal402({
      apiKey: "f402m_testkey0001",
      fetch: (async (input: RequestInfo | URL) => {
        path = new URL(String(input)).pathname;
        return json({ id: "x402-test", custody: "none" }, 201);
      }) as typeof fetch,
    });
    const result = await fiscal.processSettlement({
      amountUsdc: "1.00",
      txHash: "0x4f9c1670ca4418548266925643679b60b2f54e06f0c6527908e945e55cfafd8e",
      timestamp: "2026-09-10T12:00:00.000Z",
      payerWallet: "0xpayer",
      receiverWallet: "0xrecv",
      network: "eip155:1",
      consumerCountry: "DE",
    });
    assert.equal(path, "/settlements");
    assert.equal(result.id, "x402-test");
  });

  it("process posts /v1/fiscal-events", async () => {
    let path = "";
    const fiscal = new Fiscal402({
      apiKey: "f402m_testkey0001",
      fetch: (async (input: RequestInfo | URL) => {
        path = new URL(String(input)).pathname;
        return json({ event_id: "evt_1", status: "DETERMINED" }, 201);
      }) as typeof fetch,
    });
    const result = await fiscal.process({
      payment: { txHash: "0xabc", network: "eip155:1" },
      seller: { legalName: "Example B.V.", country: "NL" },
      buyer: { country: "DE" },
      supply: { kind: "digital_service" },
    });
    assert.equal(path, "/v1/fiscal-events");
    assert.equal(result.event_id, "evt_1");
  });

  it("propagates typed errors", async () => {
    const fiscal = new Fiscal402({
      apiKey: "f402m_testkey0001",
      fetch: (async () => json({ error: { code: "NOT_FOUND", message: "missing" } }, 404)) as typeof fetch,
    });
    await assert.rejects(() => fiscal.getSettlement("nope"), (err: unknown) => {
      assert.ok(err instanceof Fiscal402Error);
      assert.equal(err.status, 404);
      assert.equal(err.code, "NOT_FOUND");
      return true;
    });
  });
});
