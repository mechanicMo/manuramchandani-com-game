// src/components/game/ChossSystem.tsx
import { useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { RigidBody } from "@react-three/rapier";
import * as THREE from "three";
import { useMatcaps } from "@/hooks/useMatcaps";
import type { GamePhase } from "@/hooks/useGamePhase";

type Fragment = {
  id: number;
  pos: [number, number, number];
  vel: [number, number, number];
  size: number;
  spawnTime: number;
};

const MAX_FRAGS      = 14;
const LIFETIME       = 2.8;
const SPAWN_INTERVAL = 0.12;

type Props = {
  characterPos: THREE.Vector3;
  velocityRef: React.MutableRefObject<{ x: number; y: number }>;
  phase?: GamePhase;
};

export const ChossSystem = ({ characterPos, velocityRef, phase }: Props) => {
  const [fragments, setFragments] = useState<Fragment[]>([]);
  const lastSpawn = useRef(0);
  const matcaps   = useMatcaps();

  useFrame(() => {
    if (phase === "descent") return; // no rock choss on snow slope
    const now   = performance.now() / 1000;
    const vel   = velocityRef.current;
    const speed = Math.hypot(vel.x, vel.y);

    if (speed > 0.005 && now - lastSpawn.current > SPAWN_INTERVAL) {
      lastSpawn.current = now;
      const r = Math.random.bind(Math);
      setFragments(prev => [
        ...prev.slice(-(MAX_FRAGS - 1)),
        {
          id: now,
          pos: [characterPos.x + (r() - 0.5) * 0.5, characterPos.y + (r() - 0.5) * 0.4, characterPos.z + 0.15 + r() * 0.1],
          vel: [(r() - 0.5) * 5, r() * 3 + 0.5, r() * 4 + 1.5],
          size: 0.04 + r() * 0.07,
          spawnTime: now,
        },
      ]);
    }

    setFragments(prev => {
      const next = prev.filter(f => now - f.spawnTime < LIFETIME);
      return next.length === prev.length ? prev : next;
    });
  });

  return (
    <>
      {fragments.map(f => (
        <RigidBody
          key={f.id}
          position={f.pos}
          linearVelocity={f.vel}
          gravityScale={2.5}
          restitution={0.25}
          friction={0.6}
          colliders="ball"
        >
          <mesh castShadow>
            <dodecahedronGeometry args={[f.size, 0]} />
            <meshMatcapMaterial matcap={matcaps.stoneDark} />
          </mesh>
        </RigidBody>
      ))}
    </>
  );
};
