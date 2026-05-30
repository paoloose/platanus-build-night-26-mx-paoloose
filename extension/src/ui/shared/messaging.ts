// Typed message protocol between UI surfaces and the Consul Brain (service worker).
// Expanded in M1+ as the agent loop lands.

import type { Settings } from "../../types.ts";

export type BrainRequest =
  | { type: "ping" }
  | { type: "settings:get" }
  | { type: "settings:set"; patch: Partial<Settings> };

export type BrainResponse =
  | { type: "pong" }
  | { type: "settings"; settings: Settings }
  | { type: "ok" }
  | { type: "error"; error: string };

/** Send a typed request to the brain and await its typed response. */
export async function sendToBrain(req: BrainRequest): Promise<BrainResponse> {
  return chrome.runtime.sendMessage(req) as Promise<BrainResponse>;
}
