import { useRef } from "react";
import { useKeyboardControls } from "@react-three/drei";
import { useTouchControls } from "./useTouchControls";

export type MovementIntent = {
  forward: number;     // -1 to 1, positive = move away from camera (W/↑)
  strafe: number;      // -1 to 1, positive = move right (D/→)
  jump: boolean;       // true ONLY on the frame Space transitions false → true
  tuck: boolean;       // true while ↓ is held (raw state)
  climbUp: number;     // -1 to 1, used only in climb mode (W/S = up/down on face)
  climbStrafe: number; // -1 to 1, used only in climb mode (A/D = left/right)
};

// Must be used inside a KeyboardControls provider
export const useCharacterController = (): MovementIntent => {
  const up = useKeyboardControls((s) => s.up);
  const down = useKeyboardControls((s) => s.down);
  const left = useKeyboardControls((s) => s.left);
  const right = useKeyboardControls((s) => s.right);
  const jumpKey = useKeyboardControls((s) => s.jump);
  const touch = useTouchControls();

  const prevJumpRef = useRef(false);

  // Jump edge detection: true only on frame where jump goes false → true
  let jumpEdgeDetected = false;
  if (jumpKey && !prevJumpRef.current) {
    jumpEdgeDetected = true;
  }
  prevJumpRef.current = jumpKey;

  const forward = (up ? 1 : down ? -1 : 0) - touch.y;
  const strafe = (right ? 1 : left ? -1 : 0) + touch.x;

  return {
    forward,
    strafe,
    jump: jumpEdgeDetected,
    tuck: down,
    climbUp: forward,
    climbStrafe: strafe,
  };
};
