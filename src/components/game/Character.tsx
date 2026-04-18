import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, useAnimations } from "@react-three/drei";
import * as THREE from "three";
import { useCharacterController } from "@/hooks/useCharacterController";

useGLTF.preload("/character-animated.glb");

const MOVE_SPEED   = 4;
const CLIMB_RANGE  = { minY: 0, maxY: 90 };
const SIDE_RANGE   = { minX: -3, maxX: 3 };

type Props = {
  onPositionChange?: (pos: THREE.Vector3) => void;
};

export const Character = ({ onPositionChange }: Props) => {
  const group   = useRef<THREE.Group>(null);
  const posRef  = useRef(new THREE.Vector3(0, 0, 0));

  const { scene, animations } = useGLTF("/character-animated.glb");
  const { actions, mixer }    = useAnimations(animations, group);

  const velocity = useCharacterController();

  useEffect(() => {
    if (!actions) return;
    const idle = actions["idle"] ?? actions[Object.keys(actions)[0]];
    idle?.reset().fadeIn(0.3).play();
    return () => { idle?.fadeOut(0.3); };
  }, [actions]);

  useEffect(() => {
    if (!actions || !mixer) return;
    const isMovingY = Math.abs(velocity.y) > 0.1;
    const isMovingX = Math.abs(velocity.x) > 0.1;

    if (!isMovingY && !isMovingX) {
      crossFade(actions, "idle");
    } else if (velocity.y > 0.1) {
      crossFade(actions, "climb_up");
    } else if (velocity.y < -0.1) {
      crossFade(actions, "climb_down");
    }
  }, [velocity.y, velocity.x, actions, mixer]);

  useFrame((_state, delta) => {
    if (!group.current) return;

    const p = posRef.current;
    p.x = THREE.MathUtils.clamp(p.x + velocity.x * MOVE_SPEED * delta, SIDE_RANGE.minX,  SIDE_RANGE.maxX);
    p.y = THREE.MathUtils.clamp(p.y + velocity.y * MOVE_SPEED * delta, CLIMB_RANGE.minY, CLIMB_RANGE.maxY);

    group.current.position.copy(p);
    onPositionChange?.(p.clone());
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
  duration = 0.25
) => {
  const next = actions[name];
  if (!next || next.isRunning()) return;

  Object.values(actions).forEach(a => a?.fadeOut(duration));
  next.reset().fadeIn(duration).play();
};
