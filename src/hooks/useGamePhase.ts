import { useState } from "react";

export type GamePhase = "ascent" | "summit" | "descent";

export const SUMMIT_Y = 80;
export const DESCENT_Y = 60;

export const useGamePhase = () => {
  const [phase, setPhase] = useState<GamePhase>("ascent");

  const onCharacterY = (y: number) => {
    if (phase === "ascent" && y >= SUMMIT_Y) setPhase("summit");
    if (phase === "descent" && y <= 2) setPhase("ascent");
  };

  const beginDescent = () => {
    if (phase === "summit") setPhase("descent");
  };

  return { phase, onCharacterY, beginDescent };
};
