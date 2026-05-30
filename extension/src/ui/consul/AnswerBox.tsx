import { useState } from "react";

interface Props {
  busy: boolean;
  onSubmit: (text: string) => void;
}

export function AnswerBox({ busy, onSubmit }: Props) {
  const [text, setText] = useState("");

  function submit() {
    const t = text.trim();
    if (!t || busy) return;
    onSubmit(t);
    setText("");
  }

  return (
    <div className="wp-answer">
      <input
        className="wp-answer__input"
        autoFocus
        value={text}
        placeholder="State your case…"
        disabled={busy}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
        }}
      />
      <button className="wp-answer__submit" onClick={submit} disabled={busy || !text.trim()}>
        {busy ? "…" : "Answer"}
      </button>
    </div>
  );
}
