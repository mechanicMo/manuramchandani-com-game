import { useState, useRef } from "react";

export type GamePhase = "ascent" | "summit" | "descent";

export const SUMMIT_Y = 80;
export const DESCENT_Y = 60;

export const useGamePhase = () => {
  const [phase, setPhase]               = useState<GamePhase>("ascent");
  const [summitArriving, setSummitArriving] = useState(false);
  const summitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // z > 0 guard: only reset to ascent when the player is back at the front of the mountain,
  // not while they're still at the descent base near the newsletter kiosk (z ≈ -83)
  const onCharacterY = (y: number, z = 0) => {
    if (phase === "ascent" && y >= SUMMIT_Y) {
      setPhase("summit");
      setSummitArriving(true);
      if (summitTimerRef.current) clearTimeout(summitTimerRef.current);
      summitTimerRef.current = setTimeout(() => setSummitArriving(false), 2500);
    }
    if (phase === "descent" && y <= 2 && z > 0) setPhase("ascent");
  };

  const beginDescent = () => {
    if (phase === "summit") setPhase("descent");
  };

  return { phase, onCharacterY, beginDescent, summitArriving };
};
