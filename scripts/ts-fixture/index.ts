import { Fiscal402Client } from "@fiscal402/sdk";
import { Fiscal402 } from "@fiscal402/node";

const client: Fiscal402Client = new Fiscal402Client({
  apiKey: "f402m_your_key_here",
});
void client.capabilities.get;

const node: Fiscal402 = new Fiscal402({
  apiKey: "f402m_your_key_here",
});
void node.processSettlement;
