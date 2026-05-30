// The Consul Brain — runs in the MV3 background service worker.
// Single source of truth: owns settings, state, the agent loop (M1+), and alarms.
// In M0 this wires the message router and lifecycle hooks; logic lands in M1.

import type { BrainRequest, BrainResponse } from "../ui/shared/messaging.ts";
import { getSettings, setSettings } from "./settings.ts";

async function handle(req: BrainRequest): Promise<BrainResponse> {
  switch (req.type) {
    case "ping":
      return { type: "pong" };
    case "settings:get":
      return { type: "settings", settings: await getSettings() };
    case "settings:set":
      await setSettings(req.patch);
      return { type: "ok" };
    default:
      return { type: "error", error: `unknown request: ${(req as { type: string }).type}` };
  }
}

export function initBrain(): void {
  chrome.runtime.onMessage.addListener((req: BrainRequest, _sender, sendResponse) => {
    handle(req)
      .then(sendResponse)
      .catch((err) => sendResponse({ type: "error", error: String(err) }));
    return true; // keep the message channel open for the async response
  });

  chrome.runtime.onInstalled.addListener(() => {
    console.log("[web-passport] consul brain installed");
  });

  // Alarm handler (visa/break expiry) — wired in M1/M2.
  chrome.alarms.onAlarm.addListener((alarm) => {
    console.log("[web-passport] alarm fired (no-op in M0):", alarm.name);
  });

  console.log("[web-passport] consul brain ready");
}
