// Gate decision. In the overlay-first model the in-page content script asks the
// brain, on load, whether the consul should appear — we no longer proactively
// redirect navigations (redirect is emergency-only; see overlay.tsx + index.ts).

import type { OverlayMode } from "../ui/shared/messaging.ts";
import { domainOf } from "./url.ts";
import { findValidStamp, getActiveActivity, recordVisit } from "./state.ts";
import { getSettings } from "./settings.ts";

export interface GateDecision {
  summon: boolean;
  mode: OverlayMode;
}

/** Decide whether the consul should appear for a freshly-loaded top-level URL. */
export async function decideForUrl(url: string, tabId: number | null): Promise<GateDecision> {
  const domain = domainOf(url);
  if (!domain) return { summon: false, mode: "entry" };

  const settings = await getSettings();
  if (!settings.enabled) return { summon: false, mode: "entry" }; // global toggle off

  const active = await getActiveActivity();
  if (active) {
    const stamp = await findValidStamp(domain, active.id);
    if (stamp) {
      await recordVisit({ domain, url, tabId: tabId ?? -1, activityId: active.id });
      return { summon: false, mode: "entry" }; // valid visa → wave through
    }
  }
  return { summon: true, mode: "entry" };
}
