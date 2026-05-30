// Injects a persona's theme.css over the default class-contract stylesheet.
// Shared by the checkpoint, overlay (M2), and the app/dashboard pages.

import type { Persona } from "../../types.ts";

export function applyTheme(persona: Persona): void {
  if (!persona.themeCss) return;
  document.getElementById("wp-persona-theme")?.remove();
  const style = document.createElement("style");
  style.id = "wp-persona-theme";
  style.textContent = persona.themeCss;
  document.head.appendChild(style);
}
