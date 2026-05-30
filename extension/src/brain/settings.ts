// Settings live in chrome.storage.local (small/hot state; spec §3).
// Activities/Stamps/VisitRecords live in IndexedDB via the offscreen doc (M1).

import type { Settings } from "../types.ts";

const KEY = "settings";

const DEFAULTS: Settings = {
  enabled: true,
  apiKey: null,
  personaId: "monika",
  clerkSession: null,
  watchRules: {},
};

export async function getSettings(): Promise<Settings> {
  const stored = await chrome.storage.local.get(KEY);
  return { ...DEFAULTS, ...(stored[KEY] as Partial<Settings> | undefined) };
}

export async function setSettings(patch: Partial<Settings>): Promise<Settings> {
  const next = { ...(await getSettings()), ...patch };
  await chrome.storage.local.set({ [KEY]: next });
  return next;
}
