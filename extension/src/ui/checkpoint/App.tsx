// Checkpoint orchestrator: runs the ask-answer ritual against the brain, renders
// the streamed consul line + persona, raises the offer modal, and plays the stamp.

import { useEffect, useMemo, useState } from "react";
import type { Persona, Turn } from "../../types.ts";
import { loadPersona } from "../../shared/persona.ts";
import { isProposal } from "../../brain/agent/tools.ts";
import { sendToBrain, type BrainResponse } from "../shared/messaging.ts";
import { useTypewriter } from "./useTypewriter.ts";
import { ConsulStage } from "./ConsulStage.tsx";
import { AnswerBox } from "./AnswerBox.tsx";
import { OfferModal } from "./OfferModal.tsx";

type Phase = "loading" | "talking" | "denied" | "error";

function applyTheme(persona: Persona) {
  if (!persona.themeCss) return;
  const existing = document.getElementById("wp-persona-theme");
  if (existing) existing.remove();
  const style = document.createElement("style");
  style.id = "wp-persona-theme";
  style.textContent = persona.themeCss;
  document.head.appendChild(style);
}

export function App() {
  const [persona, setPersona] = useState<Persona | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [turn, setTurn] = useState<Turn | null>(null);
  const [phase, setPhase] = useState<Phase>("loading");
  const [busy, setBusy] = useState(false);
  const [arguing, setArguing] = useState(false);
  const [stamping, setStamping] = useState(false);
  const [denyMsg, setDenyMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const { shown, done } = useTypewriter(turn?.message ?? "");

  // Boot: open the checkpoint session and load the persona.
  useEffect(() => {
    const dest = new URLSearchParams(location.search).get("dest");
    if (!dest) {
      setPhase("error");
      setErrorMsg("No destination specified.");
      return;
    }
    void (async () => {
      const tab = await chrome.tabs.getCurrent().catch(() => undefined);
      const res = await sendToBrain({ type: "checkpoint:start", dest, tabId: tab?.id });
      if (res.type === "checkpoint:started") {
        const p = await loadPersona(res.personaId);
        applyTheme(p);
        setPersona(p);
        setSessionId(res.sessionId);
        setTurn(res.turn);
        setPhase("talking");
      } else if (res.type === "error") {
        setPhase("error");
        setErrorMsg(res.error);
      }
    })();
  }, []);

  function consume(res: BrainResponse) {
    if (res.type === "checkpoint:turn") {
      setArguing(false);
      setTurn(res.turn);
    } else if (res.type === "checkpoint:denied") {
      setDenyMsg(res.message);
      setPhase("denied");
    } else if (res.type === "error") {
      setPhase("error");
      setErrorMsg(res.error);
    }
  }

  async function submitAnswer(text: string) {
    if (!sessionId) return;
    setBusy(true);
    const res = await sendToBrain({ type: "checkpoint:answer", sessionId, text });
    setBusy(false);
    consume(res);
  }

  async function accept() {
    if (!sessionId) return;
    setBusy(true);
    const res = await sendToBrain({ type: "checkpoint:accept", sessionId });
    if (res.type === "checkpoint:granted") {
      setStamping(true);
      setTimeout(() => location.replace(res.redirectTo), 950);
      return;
    }
    setBusy(false);
    consume(res);
  }

  const showModal = useMemo(
    () => phase === "talking" && !!turn && isProposal(turn.tool) && done && !arguing && !stamping,
    [phase, turn, done, arguing, stamping],
  );
  const showAnswer =
    phase === "talking" && !!turn && done && (!isProposal(turn.tool) || arguing) && !stamping;

  if (phase === "loading" || !persona || !turn) {
    return (
      <div className="wp-root">
        <div className="wp-stage">
          <div className="wp-dialogue">
            <p className="wp-dialogue__text">Approaching the checkpoint…</p>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="wp-root">
        <div className="wp-stage">
          <div className="wp-dialogue">
            <p className="wp-dialogue__text">The checkpoint is unmanned. ({errorMsg})</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="wp-root" data-emotion={turn.emotion}>
      <ConsulStage
        persona={persona}
        emotion={turn.emotion}
        shownText={phase === "denied" ? denyMsg || turn.message : shown}
        streaming={!done && phase === "talking"}
      >
        {showAnswer && <AnswerBox busy={busy} onSubmit={submitAnswer} />}
      </ConsulStage>

      {showModal && (
        <OfferModal turn={turn} busy={busy} onAccept={accept} onArgue={() => setArguing(true)} />
      )}

      {stamping && <div className="wp-stamp" />}
    </div>
  );
}
