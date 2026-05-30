// Checkpoint page — the border-control UI shown (via redirect) on entry.
// M0: a placeholder that proves the redirect + React mount work end-to-end.
// M1 fills in the consul conversation, accept/argue loop, and stamp animation.

export function App() {
  const params = new URLSearchParams(location.search);
  const dest = params.get("dest");

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        fontFamily: "system-ui, sans-serif",
        background: "#0f1020",
        color: "#f4f4f8",
        gap: 16,
        textAlign: "center",
        padding: 24,
        boxSizing: "border-box",
      }}
    >
      <div style={{ fontSize: 64 }}>🛂</div>
      <h1 style={{ margin: 0 }}>Border Checkpoint</h1>
      <p style={{ opacity: 0.8, maxWidth: 480 }}>
        Halt, traveler. The consul will see you now.
      </p>
      {dest && (
        <p style={{ opacity: 0.6, fontSize: 14 }}>
          Destination: <code>{dest}</code>
        </p>
      )}
      <p style={{ opacity: 0.4, fontSize: 12 }}>(M0 placeholder — interrogation lands in M1)</p>
    </div>
  );
}
