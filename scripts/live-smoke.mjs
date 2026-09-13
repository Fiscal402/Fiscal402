#!/usr/bin/env node
/**
 * Non-destructive smoke against https://api.fiscal402.com.
 * Does not create settlements. Does not use operator credentials.
 */
import { Fiscal402Client } from "@fiscal402/sdk";

const origin = process.env.FISCAL402_ORIGIN ?? "https://api.fiscal402.com";
const client = new Fiscal402Client({ origin });

const catalog = await client.capabilities.get();
if (!catalog.protocol_version) {
  console.error("capabilities missing protocol_version");
  process.exit(1);
}
if (catalog.custody && catalog.custody !== "none") {
  console.error(`unexpected custody ${catalog.custody}`);
  process.exit(1);
}

const check = await client.capabilities.check({
  protocol: "x402",
  network: "eip155:1",
  asset: "USDC",
  seller_country: "NL",
  buyer_country: "DE",
  supply_type: "digital_service",
});
if (!check || typeof check !== "object") {
  console.error("capabilities check returned nothing");
  process.exit(1);
}

const jwks = await client.jwks.get();
if (!jwks.keys || jwks.keys.length === 0) {
  console.error("JWKS empty");
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      origin,
      protocol_version: catalog.protocol_version,
      tax_ruleset_version: catalog.tax_ruleset_version,
      check_overall: check.overall ?? check,
      jwks_keys: jwks.keys.length,
    },
    null,
    2,
  ),
);
