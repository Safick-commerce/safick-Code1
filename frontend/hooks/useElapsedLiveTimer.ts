import { useEffect, useState } from "react";
import { formatLiveDuration } from "../lib/liveDuration";

/** Live-updating elapsed timer from a fixed ISO start time. */
export function useElapsedLiveTimer(startedAt: string | null | undefined): string {
  const [label, setLabel] = useState("0:00");

  useEffect(() => {
    if (!startedAt) {
      setLabel("0:00");
      return;
    }
    const startMs = Date.parse(startedAt);
    if (!Number.isFinite(startMs)) {
      setLabel("0:00");
      return;
    }

    const tick = () => {
      const elapsedSec = Math.floor((Date.now() - startMs) / 1000);
      setLabel(formatLiveDuration(elapsedSec));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  return label;
}
