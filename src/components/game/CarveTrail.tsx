// src/components/game/CarveTrail.tsx
// Snow spray that fans out from the board during descent carving.
// Tracks lateral velocity internally; no extra props needed beyond characterPos + phase.
import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { GamePhase } from "@/hooks/useGamePhase";

const POOL_N = 48;
const CARVE_THRESHOLD = 0.02; // min |dx| per frame to trigger spray

type P = {
  active: boolean;
  px: number; py: number; pz: number;
  vx: number; vy: number; vz: number;
  life: number; maxLife: number;
};

const mkPool = (): P[] =>
  Array.from({ length: POOL_N }, () => ({
    active: false,
    px: 0, py: 0, pz: 0,
    vx: 0, vy: 0, vz: 0,
    life: 0, maxLife: 0.5,
  }));

type Props = { characterPos: THREE.Vector3; phase: GamePhase };

export const CarveTrail = ({ characterPos, phase }: Props) => {
  const ptsRef   = useRef<THREE.Points>(null);
  const pool     = useRef<P[]>(mkPool());
  const prevPos  = useRef(new THREE.Vector3());
  const spawnTimer = useRef(0);
  const poolHead = useRef(0);

  const positions = useMemo(() => new Float32Array(POOL_N * 3), []);
  const colors    = useMemo(() => new Float32Array(POOL_N * 3).fill(0.9), []);

  useFrame((_, delta) => {
    if (!ptsRef.current || phase !== "descent") return;

    const dx = characterPos.x - prevPos.current.x;
    prevPos.current.copy(characterPos);

    // Spawn during active carve
    spawnTimer.current += delta;
    const carving = Math.abs(dx) > CARVE_THRESHOLD;

    if (carving && spawnTimer.current > 0.025) {
      spawnTimer.current = 0;
      const sprayDir = dx > 0 ? 1 : -1; // spray outward from turn

      for (let k = 0; k < 3; k++) {
        const i = poolHead.current % POOL_N;
        poolHead.current++;
        const p = pool.current[i];
        p.active  = true;
        p.px = characterPos.x + (Math.random() - 0.5) * 0.4;
        p.py = characterPos.y - 0.2 + Math.random() * 0.3;
        p.pz = characterPos.z + (Math.random() - 0.5) * 0.5;
        // Fan out to the side opposite the carve direction, slight upward
        p.vx = sprayDir * (1.0 + Math.random() * 1.5);
        p.vy = 0.4 + Math.random() * 0.8;
        p.vz = (Math.random() - 0.5) * 0.8;
        p.life    = 0;
        p.maxLife = 0.3 + Math.random() * 0.25;
      }
    }

    // Update
    const ps = pool.current;
    for (let i = 0; i < POOL_N; i++) {
      const p = ps[i];
      if (!p.active) { positions[i * 3 + 1] = -9999; continue; }
      p.life += delta;
      if (p.life >= p.maxLife) { p.active = false; positions[i * 3 + 1] = -9999; continue; }
      p.vy -= 3.5 * delta;
      p.px += p.vx * delta;
      p.py += p.vy * delta;
      p.pz += p.vz * delta;
      positions[i * 3]     = p.px;
      positions[i * 3 + 1] = p.py;
      positions[i * 3 + 2] = p.pz;
      const t = 1 - p.life / p.maxLife;
      // Fade from bright ice-white to almost invisible
      const v = 0.75 + t * 0.25;
      colors[i * 3]     = v;
      colors[i * 3 + 1] = v;
      colors[i * 3 + 2] = 1.0; // slight blue tint
    }

    ptsRef.current.geometry.attributes.position.needsUpdate = true;
    ptsRef.current.geometry.attributes.color.needsUpdate = true;
  });

  if (phase !== "descent") return null;

  return (
    <points ref={ptsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={positions} count={POOL_N} itemSize={3} />
        <bufferAttribute attach="attributes-color"    array={colors}    count={POOL_N} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={0.07}
        vertexColors
        transparent
        opacity={0.75}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
};
