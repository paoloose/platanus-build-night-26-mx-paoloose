// Typed message protocol between UI surfaces and the Consul Brain (service worker).

import type { PassportActivity, Settings, Turn } from "../../types.ts";

export type BrainRequest =
  | { type: "ping" }
  | { type: "settings:get" }
  | { type: "settings:set"; patch: Partial<Settings> }
  // Checkpoint ritual
  | { type: "checkpoint:start"; dest: string; tabId?: number }
  | { type: "checkpoint:answer"; sessionId: string; text: string }
  | { type: "checkpoint:accept"; sessionId: string }
  // Dashboard data
  | { type: "data:passport" };

export type BrainResponse =
  | { type: "pong" }
  | { type: "settings"; settings: Settings }
  | { type: "ok" }
  | { type: "error"; error: string }
  // Checkpoint ritual
  | { type: "checkpoint:started"; sessionId: string; personaId: string; turn: Turn }
  | { type: "checkpoint:turn"; turn: Turn }
  | { type: "checkpoint:granted"; redirectTo: string }
  | { type: "checkpoint:denied"; message: string }
  // Dashboard data
  | { type: "passport"; activities: PassportActivity[] };

/** Send a typed request to the brain and await its typed response. */
export async function sendToBrain(req: BrainRequest): Promise<BrainResponse> {
  return chrome.runtime.sendMessage(req) as Promise<BrainResponse>;
}
