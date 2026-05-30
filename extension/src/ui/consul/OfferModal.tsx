// The proposal modal: rises over a dimmed backdrop when the consul makes an offer.

import type { Turn } from "../../types.ts";

interface Props {
  turn: Turn;
  busy: boolean;
  onAccept: () => void;
  onArgue: () => void;
}

function detailFor(turn: Turn): string {
  const p = turn.params ?? {};
  switch (turn.tool) {
    case "offer_stamp":
      return `${p.durationMinutes ?? "?"} min · max ${p.maxTabs ?? "?"} tabs`;
    case "start_break_activity":
      return `${p.minutes ?? "?"} min break`;
    case "create_activity":
      return `New activity: ${p.title ?? ""}`;
    default:
      return "";
  }
}

function labelsFor(turn: Turn): { accept: string; argue: string } {
  if (turn.tool === "deny_entry") return { accept: "Fine, I'll leave", argue: "Let me argue" };
  return { accept: "Accept", argue: "Argue" };
}

export function OfferModal({ turn, busy, onAccept, onArgue }: Props) {
  const detail = detailFor(turn);
  const { accept, argue } = labelsFor(turn);

  return (
    <div className="wp-offer">
      <div className="wp-offer__backdrop">
        <div className="wp-offer__card">
          <h2 className="wp-offer__title">{turn.message}</h2>
          {detail && <p className="wp-offer__detail">{detail}</p>}
          <div className="wp-offer__actions">
            <button className="wp-offer__argue" onClick={onArgue} disabled={busy}>
              {argue}
            </button>
            <button className="wp-offer__accept" onClick={onAccept} disabled={busy}>
              {busy ? "…" : accept}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
