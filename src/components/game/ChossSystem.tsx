// src/components/game/ChossSystem.tsx
// Choss fragments — rock chips that fly off when the character moves on the wall.
// Pool-based InstancedMesh (1 draw call, no React state, no Rapier physics).
// Projectile math (pos + v*t + ½g*t²) matches original feel; collision bounce dropped
// since fragments are sub-tile-scale and nobody notices pass-through at this speed.
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useMatcaps } from "@/hooks/useMatcaps";
import type { GamePhase } from "@/hooks/useGamePhase";

const MAX_FRAGS      = 14;
const LIFETIME       = 2.5;
const SPAWN_INTERVAL = 0.12;
const GRAVITY        = -18; // units/s² — aggressive to match original gravityScale=2.5

type Frag = {
  active: boolean;
  bornAt: number;
  px: number; py: number; pz: number;
  vx: number; vy: number; vz: number;
  size: number;
};

const mkPool = (): Frag[] =>
  Array.from({ length: MAX_FRAGS }, () => ({
    active: false, bornAt: 0,
    px: 0, py: 0, pz: 0,
    vx: 0, vy: 0, vz: 0,
    size: 0.06,
  }));

const _dummy = new THREE.Object3D();
_dummy.matrixAutoUpdate = false;

type Props = {
  characterPos: THREE.Vector3;
  velocityRef: React.MutableRefObject<{ x: number; y: number }>;
  phase?: GamePhase;
};

export const ChossSystem = ({ characterPos, velocityRef, phase }: Props) => {
  const matcaps   = useMatcaps();
  const meshRef   = useRef<THREE.InstancedMesh>(null);
  const pool      = useRef<Frag[]>(mkPool());
  const poolHead  = useRef(0);
  const lastSpawn = useRef(0);

  useFrame(({ clock }) => {
    if (phase === "descent") return;
    const mesh = meshRef.current;
    if (!mesh) return;

    const now   = clock.elapsedTime;
    const vel   = velocityRef.current;
    const speed = Math.hypot(vel.x, vel.y);

    if (speed > 0.005 && now - lastSpawn.current > SPAWN_INTERVAL) {
      lastSpawn.current = now;
      const i = poolHead.current % MAX_FRAGS;
      poolHead.current++;
      const f = pool.current[i];
      f.active = true;
      f.bornAt = now;
      f.px = characterPos.x + (Math.random() - 0.5) * 0.5;
      f.py = characterPos.y + (Math.random() - 0.5) * 0.4;
      f.pz = characterPos.z + 0.15 + Math.random() * 0.1;
      f.vx = (Math.random() - 0.5) * 5;
      f.vy = Math.random() * 3 + 0.5;
      f.vz = Math.random() * 4 + 1.5;
      f.size = 0.04 + Math.random() * 0.07;
    }

    for (let i = 0; i < MAX_FRAGS; i++) {
      const f = pool.current[i];
      const t = now - f.bornAt;
      if (!f.active || t >= LIFETIME) {
        f.active = false;
        _dummy.position.set(0, -9999, 0);
        _dummy.scale.setScalar(0.001);
        _dummy.updateMatrix();
        mesh.setMatrixAt(i, _dummy.matrix);
        continue;
      }
      _dummy.position.set(
        f.px + f.vx * t,
        f.py + f.vy * t + 0.5 * GRAVITY * t * t,
        f.pz + f.vz * t,
      );
      _dummy.scale.setScalar(f.size);
      _dummy.updateMatrix();
      mesh.setMatrixAt(i, _dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  if (phase === "descent") return null;

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, MAX_FRAGS]}>
      <dodecahedronGeometry args={[1, 0]} />
      <meshMatcapMaterial matcap={matcaps.stoneDark} />
    </instancedMesh>
  );
};
