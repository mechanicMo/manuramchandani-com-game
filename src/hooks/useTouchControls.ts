import { useState, useEffect } from "react";

type Delta = { x: number; y: number };
type TouchState = Delta & { jumpDown: boolean };

// Module-level setters so VirtualJoystick can push state without prop drilling
let _setDelta: ((d: Delta) => void) | null = null;
let _setJump: ((j: boolean) => void) | null = null;

export const updateTouchDelta = (d: Delta) => _setDelta?.(d);
export const setMobileJump    = (down: boolean) => _setJump?.(down);

export const useTouchControls = (): TouchState => {
  const [delta,    setDelta] = useState<Delta>({ x: 0, y: 0 });
  const [jumpDown, setJump]  = useState(false);

  useEffect(() => {
    _setDelta = setDelta;
    _setJump  = setJump;
    return () => { _setDelta = null; _setJump = null; };
  }, []);

  return { ...delta, jumpDown };
};
