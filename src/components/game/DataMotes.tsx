// src/components/game/DataMotes.tsx
// Tiny amber specks that drift upward near tech project stops — machine ambience.
import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { LOCATIONS } from "@/data/locations";
import type { GamePhase } from "@/hooks/useGamePhase";

const MOTES_PER_STOP = 8;
const TECH_IDS = new Set([
  "prism-ledge",
  "agent-cave",
  "scout-perch",
  "seedling-outcrop",
  "meal-planner-ledge",
  "workshops-shelf",
  "leaguelads-crag",
  "community-approach",
]);

type Mote = {
  bx: number; by: number; bz: number; // base world position (stop)
  ox: number; oy: number; oz: number; // local offset within sphere
  phase: number;
  speed: number;
  range: number; // vertical travel range
};

const dummy = new THREE.Object3D();
dummy.matrixAutoUpdate = false;

type Props = { phase: GamePhase };

export const DataMotes = ({ phase }: Props) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const motes = useMemo<Mote[]>(() => {
    const out: Mote[] = [];
    for (const loc of LOCATIONS) {
      if (!TECH_IDS.has(loc.id)) continue;
      for (let i = 0; i < MOTES_PER_STOP; i++) {
        const angle = Math.random() * Math.PI * 2;
        const r     = 0.4 + Math.random() * 1.0;
        out.push({
          bx: loc.x, by: loc.y, bz: loc.z,
          ox: Math.cos(angle) * r,
          oy: Math.random() * 1.8,
          oz: Math.sin(angle) * r,
          phase: Math.random() * Math.PI * 2,
          speed: 0.25 + Math.random() * 0.35,
          range: 0.8 + Math.random() * 0.6,
        });
      }
    }
    return out;
  }, []);

  const COUNT = motes.length;

  useFrame((state) => {
    if (!meshRef.current || phase !== "ascent") return;
    const t = state.clock.elapsedTime;

    for (let i = 0; i < COUNT; i++) {
      const m = motes[i];
      // Slow upward drift cycling over range, drifting side to side
      const cycle = ((t * m.speed + m.phase) % (Math.PI * 2));
      const floatY = Math.sin(cycle) * m.range * 0.5;
      const driftX = Math.cos(t * m.speed * 0.6 + m.phase) * 0.25;
      const driftZ = Math.sin(t * m.speed * 0.5 + m.phase + 1.0) * 0.2;

      dummy.position.set(
        m.bx + m.ox + driftX,
        m.by + m.oy + floatY,
        m.bz + m.oz + driftZ,
      );
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  if (phase !== "ascent") return null;

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]}>
      <sphereGeometry args={[0.028, 4, 4]} />
      <meshBasicMaterial color="#C8860A" transparent opacity={0.55} depthWrite={false} />
    </instancedMesh>
  );
};
