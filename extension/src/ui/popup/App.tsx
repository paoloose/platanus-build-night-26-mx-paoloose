// Popup / settings UI. M0: BYOK Claude key entry (needed for real deliberation in M1)
// + a brain ping to confirm messaging works. Current-Activity + passport history land in M3.

import { useEffect, useState } from "react";
import { sendToBrain } from "../shared/messaging.ts";

export function App() {
  const [apiKey, setApiKey] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [brainOnline, setBrainOnline] = useState<boolean | null>(null);

  useEffect(() => {
    void (async () => {
      const pong = await sendToBrain({ type: "ping" });
      setBrainOnline(pong.type === "pong");
      const res = await sendToBrain({ type: "settings:get" });
      if (res.type === "settings") setApiKey(res.settings.apiKey ?? "");
    })();
  }, []);

  async function save() {
    setStatus("saving");
    await sendToBrain({ type: "settings:set", patch: { apiKey: apiKey || null } });
    setStatus("saved");
    setTimeout(() => setStatus("idle"), 1500);
  }

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", fontSize: 14 }}>
      <h2 style={{ margin: "0 0 4px" }}>🛂 Web Passport</h2>
      <div style={{ fontSize: 12, opacity: 0.6, marginBottom: 12 }}>
        Consul brain: {brainOnline === null ? "…" : brainOnline ? "online ✅" : "offline ❌"}
      </div>

      <label style={{ display: "block", marginBottom: 4 }}>Anthropic API key (BYOK)</label>
      <input
        type="password"
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
        placeholder="sk-ant-..."
        style={{ width: "100%", boxSizing: "border-box", padding: 6 }}
      />
      <button onClick={save} disabled={status === "saving"} style={{ marginTop: 8 }}>
        {status === "saved" ? "Saved ✓" : "Save"}
      </button>
    </div>
  );
}
