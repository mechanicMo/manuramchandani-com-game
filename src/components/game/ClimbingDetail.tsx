// src/components/game/ClimbingDetail.tsx
import { useMemo } from "react";
import * as THREE from "three";
import { HOLDS } from "./HoldMarkers";
import type { GamePhase } from "@/hooks/useGamePhase";

type Props = {
  phase: GamePhase;
};

// Pairs of hold indices to connect with rope
const ROPE_PAIRS: [number, number][] = [
  [0, 2],
  [3, 5],
  [6, 8],
  [9, 11],
  [12, 14],
  [15, 17],
];

// Indices of holds that get chalk dust
const CHALK_HOLDS = [1, 4, 7, 10, 13, 16, 2, 8];

// Random piton positions (x, y range on cliff face)
function makePitons(seed = 234) {
  let s = seed;
  const rand = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };

  return Array.from({ length: 4 }, (_, i) => ({
    id: i,
    x: (rand() - 0.5) * 5,
    y: 8 + rand() * 60,
    rot: rand() * Math.PI,
  }));
}

export const ClimbingDetail = ({ phase }: Props) => {
  const ropeGeometries = useMemo(() => {
    return ROPE_PAIRS.map(([ai, bi]) => {
      const a = HOLDS[ai];
      const b = HOLDS[bi];
      if (!a || !b) return null;

      const curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(a.x, a.y, 0.1),
        new THREE.Vector3((a.x + b.x) / 2, Math.min(a.y, b.y) - 0.8, 0.15),
        new THREE.Vector3(b.x, b.y, 0.1)
      );
      return new THREE.TubeGeometry(curve, 20, 0.04, 6, false);
    }).filter(Boolean) as THREE.TubeGeometry[];
  }, []);

  const pitons = useMemo(() => makePitons(), []);

  if (phase !== "ascent") return null;

  return (
    <group>
      {/* Rope segments */}
      {ropeGeometries.map((geo, i) => (
        <mesh key={i} geometry={geo}>
          <meshStandardMaterial color="#8a7040" roughness={0.9} metalness={0.1} />
        </mesh>
      ))}

      {/* Chalk dust at holds */}
      {CHALK_HOLDS.map((hi) => {
        const h = HOLDS[hi];
        if (!h) return null;
        return (
          <mesh key={hi} position={[h.x, h.y, -0.1]}>
            <circleGeometry args={[0.18, 8]} />
            <meshStandardMaterial
              color="white"
              transparent
              opacity={0.4}
              roughness={1}
              metalness={0}
            />
          </mesh>
        );
      })}

      {/* Pitons */}
      {pitons.map((p) => (
        <mesh
          key={p.id}
          position={[p.x, p.y, 0.05]}
          rotation={[0, 0, p.rot]}
        >
          <cylinderGeometry args={[0.03, 0.03, 0.3, 6]} />
          <meshStandardMaterial color="#706050" roughness={0.8} metalness={0.4} />
        </mesh>
      ))}
    </group>
  );
};
