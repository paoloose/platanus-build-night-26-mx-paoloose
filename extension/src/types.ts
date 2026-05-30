// Web Passport domain types — see docs/superpowers/specs/2026-05-29-web-passport-design.md

export type ActivityStatus = "active" | "paused" | "done";

export interface Activity {
  id: string;
  title: string;
  description: string;
  status: ActivityStatus;
  createdAt: number;
  /** Set for BREAK activities (now + minutes); null for normal activities. */
  expiresAt: number | null;
  /** Running internal notes the consul keeps about this activity. */
  consulNotes: string;
}

export interface Stamp {
  id: string;
  activityId: string;
  /** eTLD+1 — the "territory". */
  domain: string;
  grantedAt: number;
  /** time-visa */
  expiresAt: number;
  /** tab cap for this domain under this stamp */
  maxTabs: number;
  isBreak: boolean;
  /** what the user stated at the border */
  userIntent: string;
  /** short internal gatekeeping summary — never shown */
  internalReason: string;
  /** persona-voiced, user-facing justification (the granting line) */
  message: string;
  /** the full negotiation that produced this stamp */
  transcript: Turn[];
}

/** Tools the consul agent may use; see spec §6. */
export type ConsulTool =
  | "say"
  | "offer_stamp"
  | "deny_entry"
  | "start_break_activity"
  | "create_activity"
  | "switch_activity"
  | "end_activity";

/** One utterance in a negotiation — from the consul or the user. */
export interface Turn {
  tool: ConsulTool;
  /** persona-voiced text shown to the user (for user turns, the argued text) */
  message: string;
  /** constrained to the active persona's declared emotion set */
  emotion: string;
  /** present on decision tools; never shown */
  internalReason?: string;
  /** tool-specific args (domain, minutes, durationMinutes, maxTabs, title, ...) */
  params?: Record<string, unknown>;
  author: "consul" | "user";
  at: number;
}

export interface VisitRecord {
  id: string;
  domain: string;
  url: string;
  tabId: number;
  enteredAt: number;
  leftAt: number | null;
  activityId: string | null;
}

export interface Settings {
  /** BYOK Claude key (local only) */
  apiKey: string | null;
  /** active persona id */
  personaId: string;
  /** Clerk session (identity); Google tokens live in Clerk, not here */
  clerkSession: unknown | null;
  /** future: domain allow/deny config (sane defaults in v1) */
  watchRules: Record<string, unknown>;
}

// ---- Persona (declarative package; spec §5, §13) ----

export interface EmotionDef {
  /** the enum value the agent may emit via `emotion` */
  state: string;
  /** expression asset rendered by the UI for this state */
  sprite: string;
  /** optional voice/tone hint surfaced to the model */
  toneGuidance?: string;
}

export interface Persona {
  id: string;
  name: string;
  avatar: string;
  /** persona-defined emotion set */
  emotions: EmotionDef[];
  /** voice, rules of conduct, gatekeeping philosophy */
  systemPrompt: string;
}
