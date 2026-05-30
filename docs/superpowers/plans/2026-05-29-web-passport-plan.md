# Web Passport — Implementation Plan

**Date:** 2026-05-29
**Spec:** [`docs/superpowers/specs/2026-05-29-web-passport-design.md`](../specs/2026-05-29-web-passport-design.md)
**Goal:** A working build-night demo. Ordered by **demo-criticality** — the entry ritual
hard-block (M1) is the "whoa" moment and must land first. Calendar, personas, and the
marketplace come after the core is demoable.

## Guiding rules
- **Vertical slice first.** Get one end-to-end path working (intercept → deliberate →
  stamp → redirect) before breadth. Stub aggressively (mock Claude, hardcoded persona)
  and replace stubs in place.
- **Fail-open always** (spec §10) — a bug must never trap the user out of the web.
- **Two projects:** `./extension` (MV3, Bun + React) and `./server` (Next.js + Clerk).
- Commit at the end of each milestone.

---

## Milestone 0 — Scaffolding

### Extension (`./extension`)
- [ ] Add **React** + JSX to the Bun build. Update `build.ts` to bundle multiple
  entrypoints: `service-worker`, `checkpoint`, `overlay`, `popup`. Install `react`,
  `react-dom`, `idb`.
- [ ] Restructure `src/`:
  ```
  src/
    brain/            # service worker = the Consul Brain (vanilla TS)
      index.ts        # SW entry, message router, alarm handlers
      db.ts           # IndexedDB schema + accessors (via offscreen)
      state.ts        # state machine, one-active-Activity invariant
      agent.ts        # Claude (BYOK) call + tool definitions + prompt assembly
      interceptor.ts  # webNavigation + DNR + tab counting
      connectors/     # Connector interface; calendar stub
    offscreen/        # offscreen document hosting IndexedDB
    ui/
      checkpoint/     # React app for checkpoint.html
      overlay/        # React app injected as content script
      popup/          # React app for popup/settings
      shared/         # messaging client, types, components, persona renderer
    types.ts          # shared domain types (Activity, Stamp, Turn, Persona, ...)
  ```
- [ ] Rewrite `manifest.json`: name "Web Passport", permissions
  (`webNavigation`, `declarativeNetRequest`, `tabs`, `storage`, `alarms`, `offscreen`,
  `scripting`), host permissions `<all_urls>`, register the service worker, the offscreen
  doc, `checkpoint.html` (web_accessible_resource), the overlay content script, the popup.
  Add `externally_connectable` placeholder for the future marketplace origin (commented).

### Server (`./server`)
- [ ] `npx create-next-app@latest server` (App Router, TS). Keep
  `server/inspiration-codex-pet-share/` untouched as reference.
- [ ] Add **Clerk** (`@clerk/nextjs`), env vars in `.env.example`, middleware.
- [ ] Hello-world landing page + health route. Confirm Vercel-deployable.

**Done when:** both projects build; extension loads unpacked with no errors; Next.js runs.

---

## Milestone 1 — Entry ritual vertical slice (DEMO-CRITICAL)

The core loop, end-to-end, with **mock Claude first** then real Claude.

- [ ] **IndexedDB schema** (`brain/db.ts`, `offscreen/`): stores for `Activity`, `Stamp`,
  `VisitRecord`, `Settings`. Offscreen doc proxies DB calls so they survive SW restarts.
- [ ] **State module** (`brain/state.ts`): create/read Activities, enforce single active,
  write Stamps, query "valid stamp for domain under active Activity?" (expiry + tab cap).
- [ ] **Interceptor** (`brain/interceptor.ts`): on `webNavigation.onBeforeNavigate` to a
  **new domain** with no valid stamp → redirect tab to
  `checkpoint.html?dest=<url>&tabId=<id>`. Wave-through path when a valid stamp exists.
- [ ] **Brain message router** (`brain/index.ts`): handles `checkpoint:open`,
  `agent:turn`, `proposal:accept`, `proposal:argue` from the checkpoint UI.
- [ ] **Agent** (`brain/agent.ts`): assemble the system prompt (persona systemPrompt +
  injected context: active Activity, recent VisitRecords, valid stamps; calendar later).
  Define the tool schema (`say`, `offer_stamp`, `deny_entry`, `start_break_activity`,
  `create_activity`, `switch_activity`, `end_activity`) — each carries `message`+`emotion`.
  **Start with a deterministic mock** that returns canned turns, then swap to a real
  Anthropic `fetch` call (BYOK key from Settings).
- [ ] **Checkpoint UI** (`ui/checkpoint/`): render the consul (avatar + emotion), the
  conversation transcript, an input for arguing, and an **Accept** button on proposals.
  On accept → `proposal:accept` → brain commits Stamp → **stamp animation** → redirect the
  tab to `dest`.
- [ ] **Expiry alarm**: on `offer_stamp` accept, schedule a `chrome.alarms` entry at
  `expiresAt`.
- [ ] **Settings bootstrap**: a minimal popup field to paste the **BYOK Claude key**
  (needed for real deliberation).

**Done when (demo path):** navigate to a fresh domain → page is hard-blocked → consul
interrogates → you argue/accept → stamp animation → page loads → revisiting within the
visa waves through.

---

## Milestone 2 — Mid-session enforcement (overlay)

- [ ] **Overlay content script** (`ui/overlay/`): injected at `document_start`; hidden
  until the brain summons it. Renders the same consul UI on top of the live page.
- [ ] **Visa expiry**: alarm fires → brain messages overlay in all tabs on that domain →
  "time's up, leave or appeal" → accept (navigate away / re-block) or argue (`offer_stamp`
  extension).
- [ ] **Tab limit**: track open tab count per domain (`chrome.tabs` events); opening tab
  #(maxTabs+1) → summon overlay/checkpoint to argue for a higher cap.

**Done when:** a granted visa visibly expires and the consul takes over the live tab; tab
cap triggers the consul.

---

## Milestone 3 — Activities & self-awareness

- [ ] Implement `create_activity` / `switch_activity` / `end_activity` proposal commits.
- [ ] **Breaks**: `start_break_activity` creates a break Activity (`expiresAt`), auto-
  switches; timer ends it (no `end_break` tool) → prompt to resume/pick next Activity.
- [ ] **Activity-fit** trigger: entering a domain that doesn't fit the active Activity →
  agent proposes create/switch/break.
- [ ] **Popup/settings**: show the **current Activity**, recent stamps (the passport), and
  persona selection.

**Done when:** only one Activity is ever active; switching is an explicit accepted ritual;
breaks self-expire; the popup shows your passport.

---

## Milestone 4 — Calendar context (Clerk)

- [ ] **Server**: `GET /api/calendar/today` — verify Clerk session, fetch the user's Google
  OAuth token from Clerk, call Google Calendar API, return today's events. Configure the
  Clerk Google social connection with the Calendar read scope.
- [ ] **Extension**: integrate `@clerk/chrome-extension` in the popup (sign in). Brain
  calls `/api/calendar/today` with the Clerk token and **injects events into the agent
  prompt**. Fail-open if not signed in / not connected.

**Done when:** the consul references a real calendar event in its deliberation.

---

## Milestone 5 — Personas (declarative packages)

- [ ] Define `Persona` + `PersonaPackage` types and a **validator** (every declared emotion
  has a sprite; required fields present).
- [ ] Build **one default persona** (manifest + avatar + emotion sprites) bundled with the
  extension; wire the UI to render `emotion → sprite`.
- [ ] **Install paths**: install-by-URL/ID (fetch package from `./server`, validate, cache
  assets in IndexedDB) + local-file import in settings.
- [ ] **Server**: route that serves a persona package by id.

**Done when:** the default persona renders with per-message emotions; a second persona can
be installed by URL.

---

## Milestone 6 — Web (landing + marketplace stub)

- [ ] **Landing page** on `./server` (what Web Passport is + install link).
- [ ] **Marketplace browse** (optional / stretch): a gallery of personas modeled on
  `inspiration-codex-pet-share/src/gallery/*`, listing installable packages. Upload/creator
  flows remain cut-list.

**Done when:** there's a public landing page; (stretch) personas are browsable.

---

## Cross-cutting / polish
- [ ] **Fail-open handlers** (spec §10): no key, LLM error/timeout, calendar down, SW
  killed mid-flow, undeclared emotion.
- [ ] **Stamp animation** polish (the shareable moment).
- [ ] **Tests** (spec §11): stamp validity, single-active invariant, emotion validation,
  break expiry; agent-contract fixture; manual E2E on 2–3 domains.
- [ ] **Demo script**: a rehearsed path that shows entry block → negotiation → stamp →
  expiry takeover, ideally with a calendar reference.

## Suggested order if time is tight
M0 → M1 (mock then real Claude) → M3 (activities, the soul) → M2 (expiry takeover, the
drama) → M5 (default persona, the charm) → M4 (calendar, the smarts) → M6 (landing).
