import type { Activity, Persona, Turn, VisitRecord } from "../../types.ts";
import type { OverlayMode } from "../../ui/shared/messaging.ts";

/** Everything the consul knows when deciding a single border crossing. */
export interface DeliberationContext {
  destUrl: string;
  domain: string;
  /** entry | expiry (visa ran out) | tablimit (too many tabs) */
  mode: OverlayMode;
  persona: Persona;
  activeActivity: Activity | null;
  recentVisits: VisitRecord[];
  // today's calendar events land in M4
}

/** Produces the consul's next turn given the context and the conversation so far. */
export type Deliberate = (
  ctx: DeliberationContext,
  transcript: Turn[],
) => Promise<Turn>;
