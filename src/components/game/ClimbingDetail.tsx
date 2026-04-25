// src/components/game/ClimbingDetail.tsx
// Decorative climbing details on the mountain face: rope segments, chalk marks, pitons.
// Updated to use full 3D hold positions (z≈36 on the mountain's front climb face).
import { useMemo } from "react";
import * as THREE from "three";
import { HOLDS } from "./HoldMarkers";
import type { GamePhase } from "@/hooks/useGamePhase";

type Props = { phase: GamePhase };

// Pairs of adjacent hold indices to connect with rope — zigzag across the face
const ROPE_PAIRS: [number, number][] = [
  [0, 2], [1, 3], [3, 5], [4, 6],
  [6, 8], [7, 9], [9, 11], [10, 12],
  [12, 14], [13, 15], [15, 17], [16, 18],
];

// Holds that get chalk smears
const CHALK_HOLDS = [1, 3, 5, 7, 9, 11, 13, 15, 17];

function makePitons(seed = 234) {
  let s = seed;
  const rand = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
  return Array.from({ length: 5 }, (_, i) => ({
    id: i,
    x: (rand() - 0.5) * 16,
    y: 5 + rand() * 68,
    z: 36.15,
    rotZ: rand() * Math.PI,
  }));
}

export const ClimbingDetail = ({ phase }: Props) => {
  const ropeGeometries = useMemo(() => {
    return ROPE_PAIRS.map(([ai, bi]) => {
      const a = HOLDS[ai];
      const b = HOLDS[bi];
      if (!a || !b) return null;

      // Catenary sag toward the rock face (negative z offset for midpoint)
      const mid = new THREE.Vector3(
        (a.x + b.x) / 2,
        Math.min(a.y, b.y) - 1.0,
        a.z - 0.3,
      );
      const curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(a.x, a.y, a.z + 0.05),
        mid,
        new THREE.Vector3(b.x, b.y, b.z + 0.05),
      );
      return new THREE.TubeGeometry(curve, 14, 0.025, 5, false);
    }).filter(Boolean) as THREE.TubeGeometry[];
  }, []);

  const pitons = useMemo(() => makePitons(), []);

  if (phase !== "ascent") return null;

  return (
    <group>
      {/* Rope segments — worn tan hemp rope */}
      {ropeGeometries.map((geo, i) => (
        <mesh key={i} geometry={geo}>
          <meshBasicMaterial color="#7a6035" />
        </mesh>
      ))}

      {/* Chalk smears — faint white circles on the face at hold positions */}
      {CHALK_HOLDS.map((hi) => {
        const h = HOLDS[hi];
        if (!h) return null;
        return (
          <mesh key={hi} position={[h.x + (hi % 2 === 0 ? 0.2 : -0.15), h.y - 0.25, h.z - 0.05]}>
            <circleGeometry args={[0.22, 7]} />
            <meshBasicMaterial color="white" transparent opacity={0.28} side={THREE.DoubleSide} depthWrite={false} />
          </mesh>
        );
      })}

      {/* Pitons — short steel pegs hammered into the face */}
      {pitons.map((p) => (
        <mesh
          key={p.id}
          position={[p.x, p.y, p.z]}
          rotation={[0, 0, p.rotZ]}
        >
          <cylinderGeometry args={[0.025, 0.02, 0.28, 5]} />
          <meshBasicMaterial color="#5a5040" />
        </mesh>
      ))}
    </group>
  );
};
