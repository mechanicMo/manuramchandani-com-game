import { useKeyboardControls } from "@react-three/drei";
import { useTouchControls } from "./useTouchControls";

export type Velocity = { x: number; y: number };

// Must be used inside a KeyboardControls provider
export const useCharacterController = (): Velocity => {
  const up = useKeyboardControls((s) => s.up);
  const down = useKeyboardControls((s) => s.down);
  const left = useKeyboardControls((s) => s.left);
  const right = useKeyboardControls((s) => s.right);
  const touch = useTouchControls();

  return {
    x: (right ? 1 : left ? -1 : 0) + touch.x,
    y: (up ? 1 : down ? -1 : 0) - touch.y,
  };
};
