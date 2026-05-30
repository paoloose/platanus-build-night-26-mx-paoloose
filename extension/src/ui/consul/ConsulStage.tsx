// The shared consul layout: streamed dialogue (left) + persona portrait (right).

import type { ReactNode } from "react";
import type { Persona } from "../../types.ts";
import { neutralEmotion } from "../../shared/persona.ts";

interface Props {
  persona: Persona;
  emotion: string;
  shownText: string;
  streaming: boolean;
  children?: ReactNode; // the answer box
}

export function ConsulStage({ persona, emotion, shownText, streaming, children }: Props) {
  const code = persona.emotions.some((e) => e.code === emotion)
    ? emotion
    : neutralEmotion(persona);
  const sprite = persona.emotions.find((e) => e.code === code) ?? persona.emotions[0];

  return (
    <div className="wp-stage">
      <div className="wp-dialogue-col">
        <div className="wp-dialogue" data-streaming={streaming ? "true" : "false"}>
          <p className="wp-dialogue__text">{shownText}</p>
        </div>
        {children}
      </div>
      <div className="wp-persona">
        {sprite && <img className="wp-persona__sprite" src={sprite.asset} alt={persona.name} />}
        <div className="wp-persona__name">{persona.name}</div>
      </div>
    </div>
  );
}
