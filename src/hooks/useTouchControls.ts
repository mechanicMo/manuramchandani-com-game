import { useState, useEffect } from "react";

type Delta = { x: number; y: number };

export const useTouchControls = (): Delta => {
  const [delta, setDelta] = useState<Delta>({ x: 0, y: 0 });

  useEffect(() => {
    const origin = { x: 0, y: 0 };

    const onStart = (e: TouchEvent) => {
      origin.x = e.touches[0].clientX;
      origin.y = e.touches[0].clientY;
    };

    const onMove = (e: TouchEvent) => {
      const dx = (e.touches[0].clientX - origin.x) / 80;
      const dy = (e.touches[0].clientY - origin.y) / 80;
      setDelta({ x: Math.max(-1, Math.min(1, dx)), y: Math.max(-1, Math.min(1, dy)) });
    };

    const onEnd = () => setDelta({ x: 0, y: 0 });

    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend", onEnd);
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
    };
  }, []);

  return delta;
};
