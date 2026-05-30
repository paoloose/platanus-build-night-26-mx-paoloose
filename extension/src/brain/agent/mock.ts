// Deterministic mock consul — drives the full ritual with no API key, so the
// vertical slice is demoable and testable offline. Swapped for Claude when a
// BYOK key is present.

import type { Turn } from "../../types.ts";
import type { Deliberate, DeliberationContext } from "./types.ts";
import { neutralEmotion } from "../../shared/persona.ts";

function emotion(ctx: DeliberationContext, ...preferred: string[]): string {
  for (const code of preferred) {
    if (ctx.persona.emotions.some((e) => e.code === code)) return code;
  }
  return neutralEmotion(ctx.persona);
}

function parseMinutes(text: string): number | null {
  const m = text.match(/(\d{1,3})\s*(?:min|minutes|m\b)?/i);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) && n > 0 && n <= 240 ? n : null;
}

const consulTurn = (t: Partial<Turn> & Pick<Turn, "tool" | "message" | "emotion">): Turn => ({
  author: "consul",
  at: Date.now(),
  ...t,
});

export const deliberateMock: Deliberate = async (ctx, transcript) => {
  const userAnswers = transcript.filter((t) => t.author === "user");
  const lastUser = userAnswers[userAnswers.length - 1];

  // Opening: interrogate (varies by why the consul appeared).
  if (userAnswers.length === 0) {
    if (ctx.mode === "expiry") {
      return consulTurn({
        tool: "say",
        emotion: emotion(ctx, "worried", "upset"),
        message: `Time's up at ${ctx.domain}. Your visa expired. Leave now — or tell me why I should give you more.`,
      });
    }
    if (ctx.mode === "tablimit") {
      return consulTurn({
        tool: "say",
        emotion: emotion(ctx, "worried", "upset"),
        message: `That's more tabs on ${ctx.domain} than I allowed. Explain yourself, or close some.`,
      });
    }
    return consulTurn({
      tool: "say",
      emotion: emotion(ctx, "curious"),
      message: `So — ${ctx.domain}. And what exactly do you need over there? Tell me why, and how long you'll be.`,
    });
  }

  const askedMinutes = parseMinutes(lastUser?.message ?? "");

  // First answer → make an offer.
  if (userAnswers.length === 1) {
    const minutes = askedMinutes ?? 10;
    return consulTurn({
      tool: "offer_stamp",
      emotion: emotion(ctx, "happy", "curious"),
      internalReason: `First request for ${ctx.domain}; granting a modest visa of ${minutes}m.`,
      message: `Alright. ${minutes} minutes at ${ctx.domain}, and no wandering off into a dozen tabs. Deal?`,
      params: { durationMinutes: minutes, maxTabs: 2 },
    });
  }

  // They argued → concede a little, once.
  const minutes = askedMinutes ?? 20;
  return consulTurn({
    tool: "offer_stamp",
    emotion: emotion(ctx, "worried", "happy"),
    internalReason: `Appeal accepted; extending to ${minutes}m. Final offer.`,
    message: `Fine — ${minutes} minutes. That's my final offer, and I'll be counting every one of them.`,
    params: { durationMinutes: minutes, maxTabs: 3 },
  });
};
