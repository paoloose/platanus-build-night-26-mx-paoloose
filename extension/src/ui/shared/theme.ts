// Injects a persona's theme.css over the default class-contract stylesheet.
// Shared by the checkpoint page (target = document, → <style> in <head>) and the
// in-page overlay (target = shadow root, → constructable sheet to dodge page CSP).

import type { Persona } from "../../types.ts";

type StyleTarget = Document | ShadowRoot;

export function applyTheme(persona: Persona, target: StyleTarget = document): void {
  if (!persona.themeCss) return;

  if (target instanceof ShadowRoot) {
    try {
      const sheet = new CSSStyleSheet();
      sheet.replaceSync(persona.themeCss);
      target.adoptedStyleSheets = [...target.adoptedStyleSheets, sheet];
      return;
    } catch {
      // fall through to <style>
    }
  }

  const root: ParentNode = target instanceof Document ? target.head : target;
  (root as ParentNode & { querySelector(s: string): Element | null })
    .querySelector("#wp-persona-theme")
    ?.remove();
  const style = document.createElement("style");
  style.id = "wp-persona-theme";
  style.textContent = persona.themeCss;
  (root as Node).appendChild(style);
}
