"use client";

import { useState, useEffect } from "react";
import { SignInButton } from "@clerk/nextjs";
import Link from "next/link";

interface LandingClientProps {
  persona: {
    id: string;
    name: string;
    description?: string;
    defaultEmotion?: string;
    welcomeDialog?: Array<{ emotion: string; text: string }>;
    emotions: Array<{ code: string; name: string; asset: string; criteria: string }>;
    assets: Record<string, string>;
  };
}

function useTypewriter(text: string, speed = 32) {
  const [shown, setShown] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    setShown("");
    setDone(false);
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      if (i >= text.length) {
        setShown(text);
        setDone(true);
        clearInterval(id);
      } else {
        setShown(text.slice(0, i));
      }
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);

  return { shown, done };
}

export default function LandingClient({ persona }: LandingClientProps) {
  const lines =
    persona.welcomeDialog && persona.welcomeDialog.length
      ? persona.welcomeDialog
      : [{ emotion: persona.defaultEmotion || persona.emotions[0]?.code || "neutral", text: `Welcome. I'm ${persona.name}.` }];

  const [i, setI] = useState(0);
  const line = lines[Math.min(i, lines.length - 1)]!;
  const { shown, done } = useTypewriter(line.text);
  const atLast = i >= lines.length - 1;

  const emotionEntry = persona.emotions.find((e) => e.code === line.emotion) ?? persona.emotions[0];
  const spriteUrl = emotionEntry ? persona.assets[emotionEntry.asset] || persona.assets[`emotions/${emotionEntry.asset}`] : undefined;

  function advance() {
    if (!done) return;
    if (!atLast) setI((n) => n + 1);
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "var(--wp-bg)",
        color: "var(--wp-fg)",
        fontFamily: "inherit",
        overflow: "auto",
        letterSpacing: "0.02em",
      }}
    >
      {/* scanline + grain overlay */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,240,0.006) 2px, rgba(255,255,240,0.006) 4px), url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E\")",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) clamp(200px, 28vw, 380px)",
          alignItems: "stretch",
          gap: 0,
          maxWidth: 1000,
          margin: "0 auto",
          padding: 48,
          minHeight: "100%",
          boxSizing: "border-box",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 18, alignItems: "flex-start" }}>
          <img
            src="/assets/title-logo.png"
            alt="Web Passport"
            style={{ width: "clamp(120px, 24vw, 300px)", height: "auto", objectFit: "contain", marginBottom: 8 }}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
          <h1
            style={{
              fontSize: "clamp(36px, 5.5vw, 60px)",
              margin: 0,
              lineHeight: 1.05,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "var(--wp-fg)",
            }}
          >
            Web Passport
          </h1>
          <p
            style={{
              fontSize: "clamp(14px, 1.5vw, 17px)",
              color: "var(--wp-muted)",
              maxWidth: "44ch",
              margin: 0,
              lineHeight: 1.6,
            }}
          >
            Now you need a passport for the web. A consul stands at every border — state your intent, get your stamp, stay honest about where you're going.
          </p>

          {/* dialogue box */}
          <div
            onClick={advance}
            style={{
              background: "transparent",
              border: "none",
              padding: "0 0 28px",
              position: "relative",
              cursor: done && !atLast ? "pointer" : "default",
              maxWidth: "44ch",
            }}
          >
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                width: "100%",
                height: 1,
                background: "linear-gradient(to right, var(--wp-red) 0%, var(--wp-border) 30%, transparent 100%)",
              }}
            />
            <p
              style={{
                fontSize: "clamp(16px, 1.6vw, 20px)",
                lineHeight: 1.65,
                margin: 0,
                color: "var(--wp-fg)",
                letterSpacing: "0.02em",
              }}
            >
              {shown}
              {!done && (
                <span style={{ display: "inline", color: "var(--wp-red-bright)", marginLeft: 2 }}>▌</span>
              )}
            </p>
          </div>

          {done && !atLast && (
            <span
              onClick={advance}
              style={{
                fontSize: 11,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--wp-muted)",
                cursor: "pointer",
                userSelect: "none",
              }}
            >
              click to continue ▸
            </span>
          )}

          <SignInButton mode="modal">
            <button
              style={{
                font: "inherit",
                fontWeight: 700,
                fontSize: 13,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                padding: "12px 28px",
                border: "1px solid var(--wp-red)",
                background: "var(--wp-red)",
                color: "var(--wp-fg)",
                cursor: "pointer",
                marginTop: 4,
                transition: "background 150ms ease",
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLButtonElement).style.background = "var(--wp-red-bright)";
                (e.target as HTMLButtonElement).style.borderColor = "var(--wp-red-bright)";
                (e.target as HTMLButtonElement).style.color = "#fff";
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLButtonElement).style.background = "var(--wp-red)";
                (e.target as HTMLButtonElement).style.borderColor = "var(--wp-red)";
                (e.target as HTMLButtonElement).style.color = "var(--wp-fg)";
              }}
            >
              Sign in to begin
            </button>
          </SignInButton>

          <Link
            href="/marketplace"
            style={{
              fontSize: 11,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--wp-muted)",
              marginTop: 12,
            }}
          >
            Browse the consulate →
          </Link>
        </div>

        {/* Persona right */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-end",
            padding: "0 0 0 36px",
            gap: 14,
          }}
        >
          {spriteUrl && (
            <img
              src={spriteUrl}
              alt={persona.name}
              style={{
                width: "100%",
                maxWidth: 340,
                height: "auto",
                objectFit: "contain",
                filter: "contrast(1.1) brightness(0.95) drop-shadow(0 8px 24px rgba(0,0,0,0.6))",
              }}
            />
          )}
          <div
            style={{
              fontSize: 10,
              letterSpacing: "0.35em",
              textTransform: "uppercase",
              color: "var(--wp-muted)",
              padding: "6px 0",
              borderTop: "1px solid var(--wp-border)",
              borderBottom: "1px solid var(--wp-border)",
              width: "100%",
              textAlign: "center",
            }}
          >
            {persona.name}
          </div>
        </div>
      </div>
    </div>
  );
}
