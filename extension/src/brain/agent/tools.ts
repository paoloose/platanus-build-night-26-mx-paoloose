// The consul agent's tool surface (spec §6). Every tool carries `message` +
// `emotion`. Decision tools also carry `internalReason`. Tools are *proposals*
// (committed on user Accept) except `say`, which is pure conversation.

import type { ConsulTool } from "../../types.ts";

export interface AnthropicTool {
  name: ConsulTool;
  description: string;
  input_schema: {
    type: "object";
    properties: Record<string, unknown>;
    required: string[];
  };
}

/** Build the tool schema, constraining `emotion` to the persona's declared codes. */
export function buildTools(emotionCodes: string[]): AnthropicTool[] {
  const message = {
    type: "string",
    description: "What you say to the traveler, in your persona's voice. One or two sentences.",
  };
  const emotion = {
    type: "string",
    enum: emotionCodes,
    description: "Your current emotion; pick by its declared criteria.",
  };
  const internalReason = {
    type: "string",
    description: "Short internal gatekeeping note. Never shown to the traveler.",
  };

  return [
    {
      name: "say",
      description:
        "Speak to the traveler without making any decision yet — interrogate, react, push back. Use this to ask why they're here, how long, what they were doing before.",
      input_schema: {
        type: "object",
        properties: { message, emotion },
        required: ["message", "emotion"],
      },
    },
    {
      name: "offer_stamp",
      description:
        "Propose granting passage to the destination for a limited time and tab count. Commits only if the traveler accepts.",
      input_schema: {
        type: "object",
        properties: {
          message,
          emotion,
          internalReason,
          durationMinutes: { type: "number", description: "Visa length in minutes." },
          maxTabs: { type: "number", description: "Max simultaneous tabs for this domain." },
        },
        required: ["message", "emotion", "internalReason", "durationMinutes", "maxTabs"],
      },
    },
    {
      name: "deny_entry",
      description: "Propose refusing passage. The traveler may comply or argue.",
      input_schema: {
        type: "object",
        properties: { message, emotion, internalReason },
        required: ["message", "emotion", "internalReason"],
      },
    },
    {
      name: "start_break_activity",
      description:
        "Propose a timed break (a break is hard to earn — never grant on the first ask). Switches the active Activity to the break for `minutes`.",
      input_schema: {
        type: "object",
        properties: {
          message,
          emotion,
          internalReason,
          minutes: { type: "number", description: "Break length in minutes." },
        },
        required: ["message", "emotion", "internalReason", "minutes"],
      },
    },
    {
      name: "create_activity",
      description:
        "Propose opening a new Activity (the one thing they'll focus on). Becomes the single active Activity.",
      input_schema: {
        type: "object",
        properties: {
          message,
          emotion,
          internalReason,
          title: { type: "string" },
          description: { type: "string" },
        },
        required: ["message", "emotion", "internalReason", "title"],
      },
    },
    {
      name: "switch_activity",
      description: "Propose switching the active Activity to an existing one.",
      input_schema: {
        type: "object",
        properties: {
          message,
          emotion,
          internalReason,
          activityId: { type: "string" },
        },
        required: ["message", "emotion", "internalReason", "activityId"],
      },
    },
    {
      name: "end_activity",
      description: "Propose marking an Activity done.",
      input_schema: {
        type: "object",
        properties: {
          message,
          emotion,
          internalReason,
          activityId: { type: "string" },
        },
        required: ["message", "emotion", "internalReason", "activityId"],
      },
    },
  ];
}

/** Tools that are proposals (render Accept/Argue); `say` is the only non-proposal. */
export function isProposal(tool: ConsulTool): boolean {
  return tool !== "say";
}
