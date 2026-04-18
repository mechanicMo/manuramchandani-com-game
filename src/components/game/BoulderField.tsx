// src/components/game/BoulderField.tsx
import { useMemo } from "react";
import * as THREE from "three";
import type { GamePhase } from "@/hooks/useGamePhase";

type Props = {
  phase: GamePhase;
};

type BoulderCluster = {
  id: number;
  pos: [number, number, number];
  boulders: Array<{
    offset: [number, number, number];
    radius: number;
  }>;
};

function makeBoulderClusters(count: number, seed = 456): BoulderCluster[] {
  let s = seed;
  const rand = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };

  return Array.from({ length: count }, (_, i) => {
    const xLeft = rand() < 0.5;
    const x = xLeft ? -14 + rand() * 7 : 7 + rand() * 6; // [-14, -7] or [7, 13]
    const y = 5 + rand() * 53; // [5, 58]
    const z = 0; // default, x-z plane

    const boulderCount = 2 + Math.floor(rand() * 3); // 2-4 boulders per cluster
    const boulders = Array.from({ length: boulderCount }, () => ({
      offset: [
        (rand() - 0.5) * 1.5,
        (rand() - 0.5) * 1.5,
        (rand() - 0.5) * 1.5,
      ] as [number, number, number],
      radius: 0.3 + rand() * 0.7, // 0.3 to 1.0
    }));

    return {
      id: i,
      pos: [x, y, z] as [number, number, number],
      boulders,
    };
  });
}

export const BoulderField = ({ phase }: Props) => {
  if (phase !== "ascent") return null;

  const clusters = useMemo(() => makeBoulderClusters(10), []);

  return (
    <group>
      {clusters.map((cluster) => (
        <group key={cluster.id} position={cluster.pos}>
          {cluster.boulders.map((boulder, idx) => {
            // Seeded color generation for consistent hue
            let s = 789 + cluster.id * 100 + idx * 10;
            const seedRand = () => {
              s = (s * 16807) % 2147483647;
              return (s - 1) / 2147483646;
            };

            const hue = 0.07; // orange/brown
            const saturation = 0.12;
            const lightness = 0.1 + seedRand() * 0.1; // 0.1 to 0.2
            const color = new THREE.Color().setHSL(hue, saturation, lightness);

            return (
              <mesh
                key={idx}
                position={boulder.offset}
                castShadow
                receiveShadow
              >
                <dodecahedronGeometry args={[boulder.radius, 0]} />
                <meshStandardMaterial
                  color={color}
                  roughness={1}
                  metalness={0}
                />
              </mesh>
            );
          })}
        </group>
      ))}
    </group>
  );
};
