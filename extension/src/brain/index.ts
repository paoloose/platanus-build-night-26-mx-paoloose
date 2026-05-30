// The Consul Brain — runs in the MV3 background service worker.
// Single source of truth: settings, state (IndexedDB), the agent loop, sessions,
// the navigation interceptor, and alarms.

import type { BrainRequest, BrainResponse } from "../ui/shared/messaging.ts";
import { getSettings, setSettings } from "./settings.ts";
import { domainOf, checkpointUrlFor } from "./url.ts";
import { decideForUrl } from "./interceptor.ts";
import { acceptCheckpoint, answerCheckpoint, startCheckpoint } from "./checkpoint.ts";
import { getPassport, setActiveActivity } from "./state.ts";

async function handle(
  req: BrainRequest,
  sender: chrome.runtime.MessageSender,
): Promise<BrainResponse> {
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

    case "overlay:check": {
      const decision = await decideForUrl(req.url, sender.tab?.id ?? null);
      return { type: "overlay:decision", ...decision };
    }

    case "overlay:fallback": {
      // EMERGENCY ONLY: the in-page overlay failed to render → fall back to the
      // standalone checkpoint page by redirecting the sender's tab.
      const tabId = sender.tab?.id;
      if (tabId != null) await chrome.tabs.update(tabId, { url: checkpointUrlFor(req.url) });
      return { type: "ok" };
    }

    default:
      return { type: "error", error: `unknown request: ${(req as { type: string }).type}` };
  }
}

export function initBrain(): void {
  chrome.runtime.onMessage.addListener((req: BrainRequest, sender, sendResponse) => {
    handle(req, sender)
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

  // Visa / break expiry. The mid-session overlay summon (push to content script)
  // lands in M2; for now we log.
  chrome.alarms.onAlarm.addListener((alarm) => {
    console.log("[web-passport] alarm fired (overlay summon is M2):", alarm.name);
  });

  // Overlay-first: the in-page content script self-checks on load; no proactive
  // navigation redirect (redirect is emergency-only, via overlay:fallback).
  console.log("[web-passport] consul brain ready");
}
