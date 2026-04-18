// src/components/game/ForestBase.tsx
import { useMemo } from "react";
import type { GamePhase } from "@/hooks/useGamePhase";

type Props = {
  phase: GamePhase;
};

type TreeDef = {
  id: number;
  x: number;
  y: number;
  z: number;
  height: number;
  radius: number;
  trunkColor: string;
  foliageColors: [string, string, string];
};

const TRUNK_COLORS  = ["#3d2810", "#4a3218", "#2d2008"];
const FOLIAGE_TIERS = ["#142010", "#1c2e14", "#0e1a0a"];

function makeTrees(count: number, seed = 123): TreeDef[] {
  let s = seed;
  const rand = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };

  return Array.from({ length: count }, (_, i) => {
    const leftCluster = rand() < 0.5;
    const x = leftCluster
      ? -18 + rand() * 10   // left: [-18, -8]
      :   8 + rand() * 10;  // right: [8, 18]
    const y = -0.5 + rand() * 55.5; // [-0.5, 55]
    const z = -4 + rand() * 5;      // [-4, 1]

    const height = 2.0 + rand() * 2.5; // 2.0 to 4.5
    const radius = 0.6 + rand() * 0.8; // 0.6 to 1.4

    const trunkColor    = TRUNK_COLORS[Math.floor(rand() * TRUNK_COLORS.length)];
    const foliageColors: [string, string, string] = [
      FOLIAGE_TIERS[0],
      FOLIAGE_TIERS[1],
      FOLIAGE_TIERS[2],
    ];

    return { id: i, x, y, z, height, radius, trunkColor, foliageColors };
  });
}

export const ForestBase = ({ phase }: Props) => {
  const trees = useMemo(() => makeTrees(24), []);

  if (phase !== "ascent") return null;

  return (
    <group>
      {trees.map((tree) => (
        <group key={tree.id} position={[tree.x, tree.y, tree.z]}>
          {/* Trunk: tapered cylinder */}
          <mesh position={[0, tree.height * 0.35 * 0.5, 0]} castShadow>
            <cylinderGeometry
              args={[tree.radius * 0.4, tree.radius * 0.7, tree.height * 0.35, 6]}
            />
            <meshStandardMaterial color={tree.trunkColor} roughness={1} />
          </mesh>

          {/* 3 foliage tiers */}
          {([0, 1, 2] as const).map((tier) => (
            <mesh
              key={tier}
              position={[
                0,
                tree.height * 0.25 + tier * tree.height * 0.22,
                0,
              ]}
              castShadow
              receiveShadow
            >
              <coneGeometry
                args={[tree.radius * (1.2 - tier * 0.3), tree.height * 0.4, 7]}
              />
              <meshStandardMaterial color={tree.foliageColors[tier]} roughness={1} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
};
