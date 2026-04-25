import { useState, useRef } from "react";

export type GamePhase = "ascent" | "summit" | "descent";

export const SUMMIT_Y = 80;
export const DESCENT_Y = 60;

export const useGamePhase = () => {
  const [phase, setPhase]               = useState<GamePhase>("ascent");
  const [summitArriving, setSummitArriving] = useState(false);
  const summitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onCharacterY = (y: number, z = 0) => {
    if (phase === "ascent" && y >= SUMMIT_Y) {
      setPhase("summit");
      setSummitArriving(true);
      if (summitTimerRef.current) clearTimeout(summitTimerRef.current);
      summitTimerRef.current = setTimeout(() => setSummitArriving(false), 2500);
    }
    // During descent, z moves negative (slope runs from z=-42 toward z=-94+).
    // The kiosk is at z=-83 with 14-unit proximity. We must NOT reset while the player
    // is still inside that radius — otherwise the newsletter form closes mid-type.
    // At z < -98, y is near 0 and the kiosk is just outside proximity (dist ≈ 15).
    if (phase === "descent" && y <= 0.5 && z < -98) setPhase("ascent");
  };

  const beginDescent = () => {
    if (phase === "summit") setPhase("descent");
  };

  return { phase, onCharacterY, beginDescent, summitArriving };
};
