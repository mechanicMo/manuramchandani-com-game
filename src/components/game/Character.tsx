// src/components/game/Character.tsx
import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, useAnimations, useKeyboardControls } from "@react-three/drei";
import * as THREE from "three";
import { useCharacterController } from "@/hooks/useCharacterController";
import type { Hold } from "./HoldMarkers";

useGLTF.preload("/character-animated.glb");

const MOVE_SPEED  = 4;
const CLIMB_RANGE = { minY: 0, maxY: 90 };
const SIDE_RANGE  = { minX: -3, maxX: 3 };
const HOLD_NEAR   = 2.5;

type Props = {
  onPositionChange?: (pos: THREE.Vector3) => void;
  holds?: Hold[];
};

export const Character = ({ onPositionChange, holds = [] }: Props) => {
  const group  = useRef<THREE.Group>(null);
  const posRef = useRef(new THREE.Vector3(0, 0, 0));

  const { scene, animations } = useGLTF("/character-animated.glb");
  const { actions, mixer }    = useAnimations(animations, group);
  const velocity              = useCharacterController();

  const jumpPressed   = useKeyboardControls((s: Record<string, boolean>) => s.jump);
  const jumpWasDown   = useRef(false);
  const targetHold    = useRef<Hold | null>(null);
  const jumpingToHold = useRef(false);

  useEffect(() => {
    if (!actions) return;
    const idle = actions["idle"] ?? actions[Object.keys(actions)[0]];
    idle?.reset().fadeIn(0.3).play();
    return () => { idle?.fadeOut(0.3); };
  }, [actions]);

  useFrame((_state, delta) => {
    if (!group.current) return;
    const p = posRef.current;

    // Leading edge: SPACE pressed this frame but not last
    if (jumpPressed && !jumpWasDown.current && holds.length) {
      const nearest = holds
        .filter(h => h.y > p.y + 0.5)
        .sort((a, b) => Math.hypot(a.x - p.x, a.y - p.y) - Math.hypot(b.x - p.x, b.y - p.y))[0] ?? null;
      if (nearest) { targetHold.current = nearest; jumpingToHold.current = true; }
    }
    jumpWasDown.current = jumpPressed;

    if (jumpingToHold.current && targetHold.current) {
      p.x = THREE.MathUtils.lerp(p.x, targetHold.current.x, 0.1);
      p.y = THREE.MathUtils.lerp(p.y, targetHold.current.y, 0.1);
      if (Math.hypot(p.x - targetHold.current.x, p.y - targetHold.current.y) < 0.12) {
        jumpingToHold.current = false;
        targetHold.current = null;
      }
    } else {
      p.x = THREE.MathUtils.clamp(p.x + velocity.x * MOVE_SPEED * delta, SIDE_RANGE.minX, SIDE_RANGE.maxX);
      p.y = THREE.MathUtils.clamp(p.y + velocity.y * MOVE_SPEED * delta, CLIMB_RANGE.minY, CLIMB_RANGE.maxY);
    }

    group.current.position.copy(p);
    onPositionChange?.(p.clone());

    // Animation selection
    if (!actions || !mixer) return;
    const movingX = Math.abs(velocity.x) > 0.1;
    const movingY = Math.abs(velocity.y) > 0.1;
    const atHold  = !movingX && !movingY && holds.some(h => Math.hypot(p.x - h.x, p.y - h.y) < HOLD_NEAR);

    if (jumpingToHold.current) {
      crossFade(actions, "jump");
    } else if (movingY) {
      crossFade(actions, velocity.y > 0 ? "climb_up" : "climb_down");
    } else if (movingX) {
      crossFade(actions, "idle");
    } else {
      crossFade(actions, atHold ? "hang_idle" : "idle");
    }
  });

  return (
    <group ref={group} rotation={[0, Math.PI, 0]}>
      <primitive object={scene} scale={1} />
    </group>
  );
};

const crossFade = (
  actions: ReturnType<typeof useAnimations>["actions"],
  name: string,
  duration = 0.25,
) => {
  const next = actions[name];
  if (!next || next.isRunning()) return;
  Object.values(actions).forEach(a => a?.fadeOut(duration));
  next.reset().fadeIn(duration).play();
};
