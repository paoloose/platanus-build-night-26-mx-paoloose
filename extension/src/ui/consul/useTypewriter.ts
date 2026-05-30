import { useEffect, useRef, useState } from "react";

/** Reveals `text` character-by-character. Returns the shown substring + done flag. */
export function useTypewriter(text: string, charsPerSec = 45): { shown: string; done: boolean } {
  const [shown, setShown] = useState("");
  const frame = useRef<number | null>(null);

  useEffect(() => {
    setShown("");
    if (!text) return;
    const start = performance.now();
    const tick = (t: number) => {
      const n = Math.floor(((t - start) / 1000) * charsPerSec);
      if (n >= text.length) {
        setShown(text);
        return;
      }
      setShown(text.slice(0, Math.max(1, n)));
      frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [text, charsPerSec]);

  return { shown, done: shown === text };
}
