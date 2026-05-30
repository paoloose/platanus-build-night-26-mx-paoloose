// The consul negotiation, reused by BOTH surfaces:
//   - the in-page overlay (rootClassName includes wp-root--overlay; onGrant tears
//     down the overlay to reveal the page)
//   - the checkpoint page fallback (opaque; onGrant navigates to the destination)
// Parameterized by where to inject the persona theme and what to do on grant/deny.

import { useEffect, useMemo, useState } from "react";
import type { Persona, Turn } from "../../types.ts";
import { loadPersona } from "../../shared/persona.ts";
import { isProposal } from "../../brain/agent/tools.ts";
import { sendToBrain, type BrainResponse } from "../shared/messaging.ts";
import { applyTheme } from "../shared/theme.ts";
import { useTypewriter } from "./useTypewriter.ts";
import { ConsulStage } from "./ConsulStage.tsx";
import { AnswerBox } from "./AnswerBox.tsx";
import { OfferModal } from "./OfferModal.tsx";

type Phase = "loading" | "talking" | "denied" | "error";

export interface ConsulSessionProps {
  /** Destination URL being negotiated. */
  dest: string;
  /** Root class — e.g. "wp-root" (page) or "wp-root wp-root--overlay" (overlay). */
  rootClassName: string;
  /** Where to inject the persona theme (document for the page, shadow root for overlay). */
  styleTarget?: Document | ShadowRoot;
  /** Called when a stamp is granted (after the stamp animation). */
  onGrant: (redirectTo: string) => void;
  /** Called when the consul denies and the user complies. */
  onDeny?: () => void;
  /** Called once the first consul line is on screen (used for render detection). */
  onReady?: () => void;
}

export function ConsulSession({
  dest,
  rootClassName,
  styleTarget,
  onGrant,
  onDeny,
  onReady,
}: ConsulSessionProps) {
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

  useEffect(() => {
    void (async () => {
      const res = await sendToBrain({ type: "checkpoint:start", dest });
      if (res.type === "checkpoint:started") {
        const p = await loadPersona(res.personaId);
        applyTheme(p, styleTarget);
        setPersona(p);
        setSessionId(res.sessionId);
        setTurn(res.turn);
        setPhase("talking");
        onReady?.();
      } else if (res.type === "error") {
        setPhase("error");
        setErrorMsg(res.error);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dest]);

  function consume(res: BrainResponse) {
    if (res.type === "checkpoint:turn") {
      setArguing(false);
      setTurn(res.turn);
    } else if (res.type === "checkpoint:denied") {
      setDenyMsg(res.message);
      setPhase("denied");
      onDeny?.();
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
      setTimeout(() => onGrant(res.redirectTo), 950);
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
      <div className={rootClassName}>
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
      <div className={rootClassName}>
        <div className="wp-stage">
          <div className="wp-dialogue">
            <p className="wp-dialogue__text">The checkpoint is unmanned. ({errorMsg})</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={rootClassName} data-emotion={turn.emotion}>
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
