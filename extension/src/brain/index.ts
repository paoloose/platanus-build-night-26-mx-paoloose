// The Consul Brain — runs in the MV3 background service worker.
// Single source of truth: settings, state (IndexedDB), the agent loop, sessions,
// the navigation interceptor, and alarms.

import type { BrainRequest, BrainResponse } from "../ui/shared/messaging.ts";
import { getSettings, setSettings } from "./settings.ts";
import { domainOf } from "./url.ts";
import { initInterceptor } from "./interceptor.ts";
import { acceptCheckpoint, answerCheckpoint, startCheckpoint } from "./checkpoint.ts";
import { getPassport, setActiveActivity } from "./state.ts";

async function handle(req: BrainRequest): Promise<BrainResponse> {
  switch (req.type) {
    case "ping":
      return { type: "pong" };

    case "settings:get":
      return { type: "settings", settings: await getSettings() };

    case "settings:set":
      await setSettings(req.patch);
      return { type: "ok" };

    case "checkpoint:start": {
      const domain = domainOf(req.dest);
      if (!domain) return { type: "error", error: "ungated destination" };
      return startCheckpoint(req.dest, domain, req.tabId ?? null);
    }

    case "checkpoint:answer":
      return answerCheckpoint(req.sessionId, req.text);

    case "checkpoint:accept":
      return acceptCheckpoint(req.sessionId);

    case "data:passport":
      return { type: "passport", activities: await getPassport() };

    case "activity:setActive":
      await setActiveActivity(req.id);
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

  chrome.runtime.onInstalled.addListener((details) => {
    console.log("[web-passport] consul brain installed");
    // Open the onboarding / dashboard page on first install.
    if (details.reason === "install") {
      chrome.tabs.create({ url: chrome.runtime.getURL("app.html") });
    }
  });

  // Visa / break expiry. The mid-session overlay summon lands in M2; for now we log.
  chrome.alarms.onAlarm.addListener((alarm) => {
    console.log("[web-passport] alarm fired (overlay summon is M2):", alarm.name);
  });

  initInterceptor();
  console.log("[web-passport] consul brain ready");
}
