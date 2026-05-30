// Picks the consul implementation: real Claude when a BYOK key is present,
// the deterministic mock otherwise (so the demo always works).

import type { Settings } from "../../types.ts";
import type { Deliberate } from "./types.ts";
import { deliberateMock } from "./mock.ts";
import { makeClaudeDeliberate } from "./claude.ts";

export type { DeliberationContext, Deliberate } from "./types.ts";

export function deliberatorFor(settings: Settings): Deliberate {
  if (settings.apiKey && settings.apiKey.trim()) {
    return makeClaudeDeliberate(settings.apiKey.trim());
  }
  return deliberateMock;
}

export const isMock = (settings: Settings): boolean => !settings.apiKey?.trim();
