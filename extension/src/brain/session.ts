// A checkpoint negotiation in progress. Persisted in chrome.storage.session so it
// survives a service-worker restart mid-conversation (cleared when the browser closes).

import type { Turn } from "../types.ts";

export interface CheckpointSession {
  id: string;
  destUrl: string;
  domain: string;
  tabId: number | null;
  personaId: string;
  transcript: Turn[];
  status: "open" | "granted" | "denied";
  createdAt: number;
}

const key = (id: string) => `session:${id}`;

export async function createSession(input: {
  destUrl: string;
  domain: string;
  tabId: number | null;
  personaId: string;
}): Promise<CheckpointSession> {
  const session: CheckpointSession = {
    id: crypto.randomUUID(),
    transcript: [],
    status: "open",
    createdAt: Date.now(),
    ...input,
  };
  await chrome.storage.session.set({ [key(session.id)]: session });
  return session;
}

export async function getSession(id: string): Promise<CheckpointSession | null> {
  const stored = await chrome.storage.session.get(key(id));
  return (stored[key(id)] as CheckpointSession | undefined) ?? null;
}

export async function putSession(session: CheckpointSession): Promise<void> {
  await chrome.storage.session.set({ [key(session.id)]: session });
}

export async function appendTurn(session: CheckpointSession, turn: Turn): Promise<CheckpointSession> {
  const next = { ...session, transcript: [...session.transcript, turn] };
  await putSession(next);
  return next;
}

/** The traveler's first stated intent, used to title an auto-created Activity. */
export function firstIntent(session: CheckpointSession): string {
  return session.transcript.find((t) => t.author === "user")?.message ?? "";
}
