// Navigation interceptor. On a top-level navigation into a new territory with no
// valid stamp under the active Activity, redirect the tab to the checkpoint page
// (the destination never loads). Navigations with a valid stamp wave through.

import { domainOf, checkpointUrlFor } from "./url.ts";
import { findValidStamp, getActiveActivity, recordVisit } from "./state.ts";
import { getSettings } from "./settings.ts";

interface NavDetails {
  tabId: number;
  url: string;
  frameId: number;
}

async function onBeforeNavigate(details: NavDetails): Promise<void> {
  if (details.frameId !== 0) return; // top-level only

  const domain = domainOf(details.url);
  if (!domain) return; // extension/browser pages and non-http(s) are never gated

  const settings = await getSettings();
  if (!settings.enabled) return; // global toggle off → consul stands down

  const active = await getActiveActivity();
  if (active) {
    const stamp = await findValidStamp(domain, active.id);
    if (stamp) {
      // Wave through — bearer holds a valid visa.
      await recordVisit({
        domain,
        url: details.url,
        tabId: details.tabId,
        activityId: active.id,
      });
      return;
    }
  }

  // No valid stamp → summon the consul. Redirect cancels the in-flight navigation.
  await chrome.tabs.update(details.tabId, { url: checkpointUrlFor(details.url) });
}

export function initInterceptor(): void {
  chrome.webNavigation.onBeforeNavigate.addListener(
    (details) => {
      void onBeforeNavigate(details);
    },
    { url: [{ schemes: ["http", "https"] }] },
  );
}
