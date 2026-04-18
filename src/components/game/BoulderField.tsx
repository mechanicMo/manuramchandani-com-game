// src/components/game/BoulderField.tsx
import { useMemo } from "react";
import * as THREE from "three";
import type { GamePhase } from "@/hooks/useGamePhase";

type Props = {
  phase: GamePhase;
};

type Boulder = {
  offset: [number, number, number];
  radius: number;
};

type BoulderCluster = {
  id: number;
  pos: [number, number, number];
  boulders: Boulder[];
};

function makeBoulderClusters(count: number, seed = 456): BoulderCluster[] {
  let s = seed;
  const rand = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };

  return Array.from({ length: count }, (_, i) => {
    const leftSide = rand() < 0.5;
    // x on cliff flanks: ±[7, 14], z in front of cliff [−0.5, 1.5]
    const x = leftSide
      ? -(7 + rand() * 7)   // left: [-14, -7]
      :   7 + rand() * 7;   // right: [7, 14]
    const y = 2 + rand() * 63;          // [2, 65]
    const z = -0.5 + rand() * 2.0;     // [-0.5, 1.5]

    const boulderCount = 3 + Math.floor(rand() * 3); // 3-5 per cluster
    const boulders = Array.from({ length: boulderCount }, () => {
      const radius = 0.4 + rand() * 1.4; // 0.4 to 1.8
      const offsetY = (rand() - 0.5) * 1.5 - (radius * 0.3); // half-buried large boulders
      return {
        offset: [
          (rand() - 0.5) * 2.0,
          offsetY,
          (rand() - 0.5) * 1.5,
        ] as [number, number, number],
        radius,
      };
    });

    return { id: i, pos: [x, y, z] as [number, number, number], boulders };
  });
}

export const BoulderField = ({ phase }: Props) => {
  const clusters = useMemo(() => makeBoulderClusters(16), []);

  if (phase !== "ascent") return null;

  return (
    <group>
      {clusters.map((cluster) => (
        <group key={cluster.id} position={cluster.pos}>
          {cluster.boulders.map((boulder, idx) => {
            // Strata-aware color: lower = basalt, upper = limestone
            const clusterY = cluster.pos[1];
            let hue: number, sat: number, lightness: number;
            // Use per-boulder seeded lightness variation
            let bs = 789 + cluster.id * 100 + idx * 13;
            const bRand = () => {
              bs = (bs * 16807) % 2147483647;
              return (bs - 1) / 2147483646;
            };

            if (clusterY > 60) {
              // Limestone
              hue = 0.06; sat = 0.10; lightness = 0.32 + bRand() * 0.08;
            } else {
              // Basalt
              hue = 0.06; sat = 0.15; lightness = 0.18 + bRand() * 0.10;
            }
            const color = new THREE.Color().setHSL(hue, sat, lightness);

            return (
              <mesh
                key={idx}
                position={boulder.offset}
                castShadow
                receiveShadow
              >
                <dodecahedronGeometry args={[boulder.radius, 0]} />
                <meshStandardMaterial color={color} roughness={1} metalness={0} />
              </mesh>
            );
          })}
        </group>
      ))}
    </group>
  );
};
