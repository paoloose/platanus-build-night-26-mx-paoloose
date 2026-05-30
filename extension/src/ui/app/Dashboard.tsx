// Post-login dashboard. Two tabs (Dashboard stats / Your passport), with the
// consul resting silently in the bottom-right corner.

import { useEffect, useMemo, useState } from "react";
import type { PassportActivity, Persona } from "../../types.ts";
import { restEmotion, spriteFor } from "../../shared/persona.ts";
import { sendToBrain } from "../shared/messaging.ts";

type Tab = "dashboard" | "passport";

function fmtMinutes(totalMs: number): string {
  const m = Math.round(totalMs / 60000);
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

function fmtClock(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function Dashboard({ persona }: { persona: Persona }) {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [activities, setActivities] = useState<PassportActivity[] | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await sendToBrain({ type: "data:passport" });
      if (res.type === "passport") setActivities(res.activities);
    })();
  }, []);

  const stats = useMemo(() => {
    const acts = activities ?? [];
    const stamps = acts.flatMap((a) => a.stamps);
    const territories = new Set(stamps.map((s) => s.domain));
    const grantedMs = stamps.reduce((sum, s) => sum + (s.expiresAt - s.grantedAt), 0);
    const active = acts.find((a) => a.status === "active");
    return {
      activeTitle: active?.title ?? "Nothing yet",
      activities: acts.filter((a) => a.status !== "done").length,
      stamps: stamps.length,
      territories: territories.size,
      grantedMs,
    };
  }, [activities]);

  const cornerSprite = spriteFor(persona, restEmotion(persona));

  return (
    <div className="wp-root wp-dash" data-emotion={restEmotion(persona)}>
      <header className="wp-dash__header">
        <div className="wp-dash__brand">
          Web Passport <span>· {persona.name}</span>
        </div>
        <nav className="wp-dash__tabs">
          <button
            className={`wp-dash__tab ${tab === "dashboard" ? "is-active" : ""}`}
            onClick={() => setTab("dashboard")}
          >
            Dashboard
          </button>
          <button
            className={`wp-dash__tab ${tab === "passport" ? "is-active" : ""}`}
            onClick={() => setTab("passport")}
          >
            Your passport
          </button>
        </nav>
      </header>

      <div className="wp-dash__content">
        {tab === "dashboard" ? (
          <>
            <div className="wp-stat-grid">
              <StatCard value={stats.activeTitle} label="Current activity" />
              <StatCard value={String(stats.activities)} label="Open activities" />
              <StatCard value={String(stats.stamps)} label="Stamps issued" />
              <StatCard value={String(stats.territories)} label="Territories visited" />
              <StatCard value={fmtMinutes(stats.grantedMs)} label="Time granted" />
            </div>
            {activities === null && <p className="wp-empty">Reading your passport…</p>}
          </>
        ) : (
          <Passport activities={activities} />
        )}
      </div>

      {cornerSprite && (
        <div className="wp-consul-corner">
          <img src={cornerSprite} alt={persona.name} />
        </div>
      )}
    </div>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="wp-stat-card">
      <div className="wp-stat-card__value">{value}</div>
      <div className="wp-stat-card__label">{label}</div>
    </div>
  );
}

function Passport({ activities }: { activities: PassportActivity[] | null }) {
  if (activities === null) return <p className="wp-empty">Reading your passport…</p>;
  if (activities.length === 0)
    return <p className="wp-empty">No stamps yet. Cross a border and the consul will start your record.</p>;

  return (
    <div className="wp-passport">
      {activities.map((a) => (
        <div className="wp-passport__activity" key={a.id}>
          <div className="wp-passport__act-head">
            <span className="wp-passport__title">{a.title}</span>
            <span className="wp-passport__status" data-status={a.status}>
              {a.status}
            </span>
          </div>
          {a.description && <p className="wp-passport__desc">{a.description}</p>}
          {a.stamps.map((s) => (
            <div className="wp-stamp-row" key={s.id}>
              <span className="wp-stamp-row__domain">{s.domain}</span>
              <span className="wp-stamp-row__msg">“{s.message}”</span>
              <span className="wp-stamp-row__meta">
                {fmtClock(s.grantedAt)} · {fmtMinutes(s.expiresAt - s.grantedAt)} · ≤{s.maxTabs} tabs
              </span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
