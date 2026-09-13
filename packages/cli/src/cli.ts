#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import {
  Fiscal402Client,
  Fiscal402Error,
  VERSION,
  redactSecrets,
  type Fiscal402Receipt,
  type Jwks,
  type SettlementCreateInput,
} from "@fiscal402/sdk";
import { formatCapabilities, formatJson, formatVerify } from "./format.js";
import { HELP, parseArgv, type CliCommand } from "./parse.js";

export { HELP, parseArgv, VERSION };

function fail(message: string, code = 1): never {
  process.stderr.write(`${redactSecrets(message)}\n`);
  process.exit(code);
}

function print(text: string): void {
  process.stdout.write(`${text}\n`);
}

function client(origin?: string): Fiscal402Client {
  return new Fiscal402Client({ ...(origin ? { origin } : {}) });
}

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

function commandHasJson(command: CliCommand): boolean {
  return "json" in command && command.json === true;
}

export async function main(argv = process.argv.slice(2)): Promise<void> {
  const command = parseArgv(argv);
  const debug = "debug" in command && command.debug === true;
  try {
    switch (command.name) {
      case "help":
        print(HELP);
        return;
      case "version":
        print(VERSION);
        return;
      case "capabilities": {
        const doc = await client(command.origin).capabilities.get();
        print(command.json ? formatJson(doc) : formatCapabilities(doc));
        return;
      }
      case "capabilities-check": {
        const result = await client(command.origin).capabilities.check({
          ...(command.protocol ? { protocol: command.protocol } : {}),
          ...(command.network ? { network: command.network } : {}),
          ...(command.asset ? { asset: command.asset } : {}),
          ...(command.sellerCountry ? { seller_country: command.sellerCountry } : {}),
          ...(command.buyerCountry ? { buyer_country: command.buyerCountry } : {}),
          ...(command.supplyType ? { supply_type: command.supplyType } : {}),
          ...(command.buyerType ? { buyer_type: command.buyerType } : {}),
        });
        print(formatJson(result));
        return;
      }
      case "receipts-verify": {
        const receipt = readJson<Fiscal402Receipt>(command.receipt);
        const ubl = command.ubl ? readFileSync(command.ubl, "utf8") : undefined;
        const jwks = command.jwks ? readJson<Jwks>(command.jwks) : undefined;
        const report = await new Fiscal402Client().receipts.verify({
          receipt,
          ...(ubl ? { ubl } : {}),
          ...(jwks ? { jwks } : {}),
        });
        print(command.json ? formatJson(report) : formatVerify(report, String(receipt.receipt_id ?? "")));
        if (!report.verified) process.exitCode = 1;
        return;
      }
      case "receipts-get": {
        const receipt = await client(command.origin).receipts.get(command.id);
        print(formatJson(receipt));
        return;
      }
      case "settlements-get": {
        const record = await client(command.origin).settlements.get(command.id);
        print(formatJson(record));
        return;
      }
      case "settlements-create": {
        const body = readJson<SettlementCreateInput>(command.file);
        const record = await client(command.origin).settlements.create(body);
        print(formatJson(record));
        return;
      }
      case "jwks": {
        const jwks = await client(command.origin).jwks.get();
        print(formatJson(jwks));
        return;
      }
      case "unknown":
        fail(`unknown command: ${command.raw}\n\n${HELP}`, 2);
    }
  } catch (error) {
    if (error instanceof Fiscal402Error) {
      const line = commandHasJson(command)
        ? formatJson({
            error: error.code,
            status: error.status,
            message: error.message,
            requestId: error.requestId,
          })
        : `${error.code}  ${error.message}${error.requestId ? `  (${error.requestId})` : ""}`;
      process.stderr.write(`${line}\n`);
      if (debug && error.stack) process.stderr.write(`${redactSecrets(error.stack)}\n`);
      process.exitCode = 1;
      return;
    }
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`${redactSecrets(message)}\n`);
    if (debug && error instanceof Error && error.stack) {
      process.stderr.write(`${redactSecrets(error.stack)}\n`);
    }
    process.exitCode = 1;
  }
}

const invoked =
  Boolean(process.argv[1]) && import.meta.url === pathToFileURL(process.argv[1]!).href;
if (invoked) {
  await main();
}
