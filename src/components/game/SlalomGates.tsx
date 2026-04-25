// src/components/game/SlalomGates.tsx
// Slalom gate poles along the snowboard descent run.
// Alternating amber/blue flags zigzag across the slope — guides the player's path.
import { useMemo, memo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { GamePhase } from "@/hooks/useGamePhase";
import { useMatcaps } from "@/hooks/useMatcaps";

const SLOPE_Z_START  = -42;
const SLOPE_Y_TOP    = 82;
const SLOPE_Z_RATIO  = 0.65;

const yForZ = (z: number) => Math.max(0, SLOPE_Y_TOP + (z - SLOPE_Z_START) / SLOPE_Z_RATIO);

type Gate = {
  id: number;
  x: number;
  y: number;
  z: number;
  color: string;
};

function makeGates(): Gate[] {
  const gates: Gate[] = [];
  // 9 gate pairs, spaced ~6 units apart down the slope
  const gateZs = [-48, -54, -60, -66, -72, -78, -84, -90, -96];

  // Zigzag: even gates lean right, odd gates lean left
  gateZs.forEach((z, i) => {
    const side = i % 2 === 0 ? 1 : -1;
    // Main gate pole offset from center
    const xOff = side * (5 + (i % 3) * 1.2);
    const y = yForZ(z);
    const color = i % 2 === 0 ? "#C8860A" : "#4080ff";

    // Two poles per gate, ~2.8 units apart across slope
    gates.push({ id: gates.length, x: xOff - 1.4, y, z, color });
    gates.push({ id: gates.length, x: xOff + 1.4, y, z, color });
  });

  return gates;
}

const GATES = makeGates();

type Props = { phase: GamePhase };

const GatePole = memo(({ gate, matcaps }: { gate: Gate; matcaps: ReturnType<typeof useMatcaps> }) => {
  const flagRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!flagRef.current) return;
    const t = clock.getElapsedTime();
    // Each flag waves at a slightly different phase so they don't all move together
    flagRef.current.rotation.y = Math.sin(t * 2.8 + gate.id * 0.73) * 0.22;
    flagRef.current.rotation.z = Math.sin(t * 2.1 + gate.id * 1.1) * 0.05;
  });

  return (
    <group position={[gate.x, gate.y, gate.z]}>
      {/* Pole shaft */}
      <mesh position={[0, 1.0, 0]} castShadow>
        <cylinderGeometry args={[0.028, 0.032, 2.0, 5]} />
        <meshMatcapMaterial matcap={matcaps.metalSoft} />
      </mesh>
      {/* Flag panel — animated */}
      <mesh ref={flagRef} position={[0, 1.85, 0]}>
        <boxGeometry args={[0.32, 0.22, 0.008]} />
        <meshBasicMaterial color={gate.color} side={THREE.DoubleSide} />
      </mesh>
      {/* Base spike in snow */}
      <mesh position={[0, -0.08, 0]}>
        <coneGeometry args={[0.035, 0.18, 5]} />
        <meshMatcapMaterial matcap={matcaps.metalSoft} />
      </mesh>
    </group>
  );
});

export const SlalomGates = ({ phase }: Props) => {
  const matcaps = useMatcaps();

  if (phase !== "descent") return null;

  return (
    <group>
      {GATES.map(gate => (
        <GatePole key={gate.id} gate={gate} matcaps={matcaps} />
      ))}
    </group>
  );
};
