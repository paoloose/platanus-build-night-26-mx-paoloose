"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface PersonaPreview {
  id: string;
  name: string;
  description?: string;
  author?: string;
  emotions: Array<{ code: string; name: string; asset: string; criteria: string }>;
  assets: Record<string, string>;
  defaultEmotion?: string;
}

export default function Marketplace() {
  const [personas, setPersonas] = useState<PersonaPreview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/personas");
        if (!res.ok) return;
        const list = (await res.json()) as { personas: Array<{ id: string; name: string; description?: string }> };
        const full = await Promise.all(
          list.personas.map(async (p) => {
            const pkgRes = await fetch(`/api/personas/${p.id}/package`);
            if (!pkgRes.ok) return null;
            return (await pkgRes.json()) as PersonaPreview;
          }),
        );
        setPersonas(full.filter((p): p is PersonaPreview => p != null));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--wp-bg)",
        color: "var(--wp-fg)",
        padding: "clamp(24px, 5vw, 56px)",
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingBottom: 24,
          borderBottom: "1px solid var(--wp-border)",
          marginBottom: 32,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "clamp(28px, 4vw, 48px)",
              margin: 0,
              lineHeight: 1.05,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            The Consulate
          </h1>
          <p style={{ color: "var(--wp-muted)", margin: "8px 0 0", fontSize: 14 }}>
            Browse available consuls. Install one in your passport to change who guards your borders.
          </p>
        </div>
        <Link
          href="/"
          style={{
            fontSize: 11,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--wp-muted)",
          }}
        >
          ← Back
        </Link>
      </header>

      {loading ? (
        <p style={{ color: "var(--wp-muted)", padding: 40 }}>Loading consulate records…</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: 24,
          }}
        >
          {personas.map((p) => {
            const defaultEmotion = p.emotions.find((e) => e.code === p.defaultEmotion) ?? p.emotions[0];
            const sprite = defaultEmotion
              ? p.assets[defaultEmotion.asset] || p.assets[`emotions/${defaultEmotion.asset}`]
              : undefined;

            return (
              <article
                key={p.id}
                className="marketplace-card"
                style={{
                  background: "var(--wp-surface)",
                  border: "1px solid var(--wp-border)",
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                  transition: "border-color 200ms ease",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--wp-accent)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--wp-border)";
                }}
              >
                <div
                  style={{
                    height: 220,
                    background: "#0a0a0e",
                    display: "grid",
                    placeItems: "center",
                    overflow: "hidden",
                  }}
                >
                  {sprite ? (
                    <img
                      src={sprite}
                      alt={p.name}
                      style={{
                        maxHeight: "100%",
                        maxWidth: "100%",
                        objectFit: "contain",
                        filter: "contrast(1.1) brightness(0.9)",
                      }}
                    />
                  ) : (
                    <span style={{ color: "var(--wp-muted)", fontSize: 12 }}>No preview</span>
                  )}
                </div>
                <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "var(--wp-fg)" }}>{p.name}</h3>
                    <span
                      style={{
                        fontSize: 9,
                        letterSpacing: "0.15em",
                        textTransform: "uppercase",
                        color: "var(--wp-muted)",
                        border: "1px solid var(--wp-border)",
                        padding: "2px 8px",
                      }}
                    >
                      {p.id}
                    </span>
                  </div>
                  {p.description && (
                    <p style={{ margin: 0, fontSize: 13, color: "var(--wp-muted)", lineHeight: 1.5 }}>{p.description}</p>
                  )}
                  {p.author && <p style={{ margin: 0, fontSize: 11, color: "var(--wp-muted)" }}>by {p.author}</p>}
                  <div style={{ marginTop: "auto", paddingTop: 12 }}>
                    <span
                      style={{
                        fontSize: 10,
                        letterSpacing: "0.18em",
                        textTransform: "uppercase",
                        color: "var(--wp-accent)",
                      }}
                    >
                      {p.emotions.length} emotions
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {!loading && personas.length === 0 && (
        <p style={{ color: "var(--wp-muted)", padding: 40 }}>The consulate is empty. No personas on record.</p>
      )}
    </div>
  );
}
