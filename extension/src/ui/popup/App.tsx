// Popup: current persona (+ switcher), current activity (+ switcher), and a
// debug-only global enable toggle. BYOK key lives at the bottom for now.

import { useEffect, useState } from "react";
import type { PassportActivity, Persona, Settings } from "../../types.ts";
import { listPersonas, loadPersona, restEmotion, spriteFor, type PersonaSummary } from "../../shared/persona.ts";
import { sendToBrain } from "../shared/messaging.ts";
import { IS_DEBUG } from "../../shared/env.ts";

export function App() {
  const [online, setOnline] = useState<boolean | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [persona, setPersona] = useState<Persona | null>(null);
  const [personaList, setPersonaList] = useState<PersonaSummary[]>([]);
  const [activities, setActivities] = useState<PassportActivity[]>([]);
  const [apiKey, setApiKey] = useState("");
  const [keySaved, setKeySaved] = useState(false);

  async function refresh() {
    const pong = await sendToBrain({ type: "ping" });
    setOnline(pong.type === "pong");

    const s = await sendToBrain({ type: "settings:get" });
    if (s.type === "settings") {
      setSettings(s.settings);
      setApiKey(s.settings.apiKey ?? "");
      setPersona(await loadPersona(s.settings.personaId));
    }
    setPersonaList(await listPersonas());

    const p = await sendToBrain({ type: "data:passport" });
    if (p.type === "passport") setActivities(p.activities.filter((a) => a.status !== "done"));
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function patch(p: Partial<Settings>) {
    await sendToBrain({ type: "settings:set", patch: p });
    setSettings((prev) => (prev ? { ...prev, ...p } : prev));
  }

  async function switchPersona(id: string) {
    await patch({ personaId: id });
    setPersona(await loadPersona(id));
  }

  async function switchActivity(id: string) {
    if (!id) return;
    await sendToBrain({ type: "activity:setActive", id });
    await refresh();
  }

  const activeId = activities.find((a) => a.status === "active")?.id ?? "";

  return (
    <div className="wp-pop">
      <div className="wp-pop__head">
        <span className="wp-pop__title">🛂 Web Passport</span>
        <span className="wp-pop__status" data-online={String(online === true)}>
          {online === null ? "…" : online ? "consul online" : "consul offline"}
        </span>
      </div>

      {/* Persona */}
      <div className="wp-pop__section">
        <div className="wp-pop__label">Your consul</div>
        <div className="wp-pop__persona">
          {persona && (
            <img className="wp-pop__sprite" src={spriteFor(persona, restEmotion(persona))} alt={persona.name} />
          )}
          <span className="wp-pop__persona-name">{persona?.name ?? "…"}</span>
        </div>
        <select value={persona?.id ?? ""} onChange={(e) => void switchPersona(e.target.value)}>
          {personaList.length === 0 && <option value="">(none installed)</option>}
          {personaList.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
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

      {/* BYOK key (temporary home until onboarding owns it) */}
      <div className="wp-pop__section wp-pop__key">
        <div className="wp-pop__label">Anthropic API key (BYOK)</div>
        <div className="wp-pop__key-row">
          <input
            type="password"
            value={apiKey}
            placeholder="sk-ant-…  (blank = demo consul)"
            onChange={(e) => {
              setApiKey(e.target.value);
              setKeySaved(false);
            }}
          />
          <button
            onClick={async () => {
              await patch({ apiKey: apiKey || null });
              setKeySaved(true);
            }}
          >
            {keySaved ? "✓" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
