// In-page consul overlay (content script, IIFE). Instead of redirecting, we cover
// the live page with a transparent-black backdrop and mount the consul on top,
// inside a Shadow DOM at max z-index so page CSS/layout can't interfere. If the
// overlay fails to render (e.g. a hostile CSP nukes our styles), we fall back to
// the standalone checkpoint page — EMERGENCY ONLY.

import { createRoot, type Root } from "react-dom/client";
import { ConsulSession } from "./ui/consul/ConsulSession.tsx";
import { sendToBrain, type ContentMessage } from "./ui/shared/messaging.ts";

const HOST_ID = "web-passport-overlay-host";
let mounted = false;

async function fetchText(path: string): Promise<string> {
  try {
    const res = await fetch(chrome.runtime.getURL(path));
    return res.ok ? await res.text() : "";
  } catch {
    return "";
  }
}

/** Inject CSS into the shadow root. Constructable sheets dodge page CSP 'unsafe-inline'. */
function injectStyles(shadow: ShadowRoot, css: string): void {
  if (!css) return;
  try {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(css);
    shadow.adoptedStyleSheets = [...shadow.adoptedStyleSheets, sheet];
  } catch {
    const style = document.createElement("style");
    style.textContent = css;
    shadow.appendChild(style);
  }
}

function teardown(host: HTMLElement, root: Root): void {
  try {
    root.unmount();
  } catch {
    /* ignore */
  }
  host.remove();
  mounted = false;
}

/** Did the overlay actually paint full-viewport (styles applied, not stripped)? */
function rendered(shadow: ShadowRoot): boolean {
  const rootEl = shadow.querySelector<HTMLElement>(".wp-root");
  if (!rootEl) return false;
  const r = rootEl.getBoundingClientRect();
  return r.width >= window.innerWidth * 0.9 && r.height >= window.innerHeight * 0.9;
}

async function mountOverlay(dest: string): Promise<void> {
  if (mounted) return;
  mounted = true;
  try {
    const host = document.createElement("div");
    host.id = HOST_ID;
    host.style.cssText =
      "all: initial; position: fixed; inset: 0; z-index: 2147483647; pointer-events: auto;";
    (document.documentElement || document.body).appendChild(host);

    const shadow = host.attachShadow({ mode: "open" });
    injectStyles(shadow, await fetchText("default.css"));

    const mount = document.createElement("div");
    shadow.appendChild(mount);
    const root = createRoot(mount);

    root.render(
      <ConsulSession
        dest={dest}
        rootClassName="wp-root wp-root--overlay"
        styleTarget={shadow}
        onGrant={() => teardown(host, root)}
        onDeny={() => {
          /* keep the overlay up — the page stays dimmed behind it */
        }}
      />,
    );

    // Render detection → emergency redirect fallback.
    window.setTimeout(() => {
      if (!host.isConnected || !rendered(shadow)) {
        teardown(host, root);
        void sendToBrain({ type: "overlay:fallback", url: dest });
      }
    }, 1500);
  } catch {
    mounted = false;
    void sendToBrain({ type: "overlay:fallback", url: dest });
  }
}

async function main(): Promise<void> {
  if (window.top !== window) return; // top frame only

  const decision = await sendToBrain({ type: "overlay:check", url: location.href });
  if (decision.type === "overlay:decision" && decision.summon) {
    void mountOverlay(location.href);
  }

  // Mid-session interruptions (M2): the brain pushes a summon.
  chrome.runtime.onMessage.addListener((msg: ContentMessage): undefined => {
    if (msg?.type === "overlay:summon") void mountOverlay(location.href);
    return undefined;
  });
}

void main();
