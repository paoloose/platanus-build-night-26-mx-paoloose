// Loads a persona package (folder) into a resolved Persona object.
// Used by both the brain (needs systemPrompt + emotion criteria) and the UI
// (needs resolved sprite URLs + theme.css). For v1 the default persona ships
// inside the extension at dist/personas/<id>/; installed personas (M5) will load
// the same shape from IndexedDB.

import type { Persona, EmotionDef, PersonaExample, WelcomeLine } from "../types.ts";

interface PersonaJson {
  id: string;
  name: string;
  tagline?: string;
  origin?: string;
  author?: string;
  version?: string;
  description?: string;
  default_emotion?: string;
  systemPrompt: string;
  examples?: PersonaExample[];
  welcome_dialog?: WelcomeLine[];
  metadata?: Record<string, unknown>;
}

interface EmotionsCriteriaJson {
  emotions: Array<{ code: string; name: string; asset: string; criteria: string }>;
}

function packagedBaseUrl(personaId: string): string {
  return chrome.runtime.getURL(`dist/personas/${personaId}/`);
}

export async function loadPersona(personaId: string): Promise<Persona> {
  const base = packagedBaseUrl(personaId);

  const personaJson = (await (await fetch(base + "persona.json")).json()) as PersonaJson;
  const criteria = (await (
    await fetch(base + "emotions/emotions_criteria.json")
  ).json()) as EmotionsCriteriaJson;

  const emotions: EmotionDef[] = criteria.emotions.map((e) => ({
    code: e.code,
    name: e.name,
    // resolve the relative asset path to a loadable extension URL
    asset: base + e.asset,
    criteria: e.criteria,
  }));

  let themeCss: string | undefined;
  try {
    const res = await fetch(base + "theme.css");
    if (res.ok) themeCss = await res.text();
  } catch {
    // theme.css is optional
  }

  return {
    id: personaJson.id,
    name: personaJson.name,
    tagline: personaJson.tagline,
    origin: personaJson.origin,
    author: personaJson.author,
    version: personaJson.version,
    description: personaJson.description,
    defaultEmotion: personaJson.default_emotion,
    systemPrompt: personaJson.systemPrompt,
    examples: personaJson.examples,
    welcomeDialog: personaJson.welcome_dialog,
    emotions,
    themeCss,
    metadata: personaJson.metadata,
  };
}

/** The emotion code to fall back to when the agent emits an undeclared one. */
export function neutralEmotion(persona: Persona): string {
  if (persona.defaultEmotion && persona.emotions.some((e) => e.code === persona.defaultEmotion)) {
    return persona.defaultEmotion;
  }
  const preferred = persona.emotions.find((e) => /curious|neutral|calm/i.test(e.code));
  return (preferred ?? persona.emotions[0])?.code ?? "neutral";
}

/** The resting/idle emotion to show when the consul is silent (popup, corner). */
export function restEmotion(persona: Persona): string {
  return neutralEmotion(persona);
}

/** The asset URL for a given emotion code (falls back to the resting emotion). */
export function spriteFor(persona: Persona, emotionCode: string): string | undefined {
  const match = persona.emotions.find((e) => e.code === emotionCode);
  const rest = persona.emotions.find((e) => e.code === restEmotion(persona));
  return (match ?? rest ?? persona.emotions[0])?.asset;
}
