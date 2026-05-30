// Popup. Two states:
//   - NOT set up  -> logo + invitation to set up (opens the onboarding page).
//   - set up      -> consul (+ "Change consul"), current activity (+ switcher),
//                    debug toggle, and View Passport / Configure buttons.
// "Passport" and "Configure" open the respective tabs of the app/dashboard page.

import { useEffect, useState } from "react";
import type { PassportActivity, Persona, Settings } from "../../types.ts";
import { listPersonas, loadPersona, restEmotion, spriteFor, type PersonaSummary } from "../../shared/persona.ts";
import { sendToBrain } from "../shared/messaging.ts";
import { isSignedIn } from "../app/auth.ts";
import { IS_DEBUG } from "../../shared/env.ts";

function openApp(tab?: "dashboard" | "passport" | "configure") {
  const url = chrome.runtime.getURL(tab ? `app.html?tab=${tab}` : "app.html");
  void chrome.tabs.create({ url });
  window.close();
}

export function App() {
  const [ready, setReady] = useState(false);
  const [setup, setSetup] = useState(false);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [persona, setPersona] = useState<Persona | null>(null);
  const [personaList, setPersonaList] = useState<PersonaSummary[]>([]);
  const [activities, setActivities] = useState<PassportActivity[]>([]);
  const [changing, setChanging] = useState(false);

  useEffect(() => {
    void (async () => {
      const signedIn = await isSignedIn();
      setSetup(signedIn);
      if (signedIn) {
        const s = await sendToBrain({ type: "settings:get" });
        if (s.type === "settings") {
          setSettings(s.settings);
          setPersona(await loadPersona(s.settings.personaId));
        }
        setPersonaList(await listPersonas());
        const p = await sendToBrain({ type: "data:passport" });
        if (p.type === "passport") setActivities(p.activities.filter((a) => a.status !== "done"));
      }
      setReady(true);
    })();
  }, []);

  async function patch(p: Partial<Settings>) {
    await sendToBrain({ type: "settings:set", patch: p });
    setSettings((prev) => (prev ? { ...prev, ...p } : prev));
  }

  async function switchPersona(id: string) {
    await patch({ personaId: id });
    setPersona(await loadPersona(id));
    setChanging(false);
  }

  async function switchActivity(id: string) {
    if (!id) return;
    await sendToBrain({ type: "activity:setActive", id });
    const p = await sendToBrain({ type: "data:passport" });
    if (p.type === "passport") setActivities(p.activities.filter((a) => a.status !== "done"));
  }

  if (!ready) return <div className="wp-pop" />;

  // ---- Not set up: invite to onboarding ----
  if (!setup) {
    return (
      <div className="wp-pop wp-pop--setup">
        <img className="wp-pop__logo" src="assets/logo.png" alt="Web Passport" />
        <div className="wp-pop__welcome">Welcome to Web Passport</div>
        <p className="wp-pop__sub">A consul stands at every border. Let's get you a passport.</p>
        <button className="wp-pop__setup-btn" onClick={() => openApp()}>
          Set up Web Passport
        </button>
      </div>
    );
  }

  // ---- Set up ----
  const activeId = activities.find((a) => a.status === "active")?.id ?? "";

  return (
    <div className="wp-pop">
      <div className="wp-pop__head">
        <span className="wp-pop__title">🛂 Web Passport</span>
      </div>

      {/* Persona */}
      <div className="wp-pop__section">
        <div className="wp-pop__persona">
          {persona && (
            <img className="wp-pop__sprite" src={spriteFor(persona, restEmotion(persona))} alt={persona.name} />
          )}
          <div>
            <div className="wp-pop__persona-name">{persona?.name ?? "…"}</div>
            <button className="wp-pop__textbtn" onClick={() => setChanging((v) => !v)}>
              Change consul
            </button>
          </div>
        </div>
        {changing && (
          <select value={persona?.id ?? ""} onChange={(e) => void switchPersona(e.target.value)}>
            {personaList.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Activity */}
      <div className="wp-pop__section">
        <div className="wp-pop__label">Current activity</div>
        <div className="wp-pop__activity-now" data-none={String(activeId === "")}>
          {activities.find((a) => a.id === activeId)?.title ?? "No activity"}
        </div>
        {activities.length > 0 && (
          <select value={activeId} onChange={(e) => void switchActivity(e.target.value)}>
            <option value="" disabled>
              Switch activity…
            </option>
            {activities.map((a) => (
              <option key={a.id} value={a.id}>
                {a.title}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Debug-only global toggle */}
      {IS_DEBUG && settings && (
        <div className="wp-pop__section">
          <div className="wp-pop__toggle">
            <span className="wp-pop__toggle-label">Consul active</span>
            <input
              type="checkbox"
              className="wp-pop__switch"
              checked={settings.enabled}
              onChange={(e) => void patch({ enabled: e.target.checked })}
            />
          </div>
          <div className="wp-pop__debug-note">Debug build — when off, no site is gated.</div>
        </div>
      )}

      {/* Navigation to the app page */}
      <div className="wp-pop__actions">
        <button className="wp-pop__action" onClick={() => openApp("passport")}>
          View passport
        </button>
        <button className="wp-pop__action wp-pop__action--ghost" onClick={() => openApp("configure")}>
          Configure
        </button>
      </div>
    </div>
  );
}
