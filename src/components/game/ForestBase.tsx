// src/components/game/ForestBase.tsx
// Low-poly trees around the mountain base.
// Three clusters: front (Z 50-78 near spawn), left flank (X -18 to -28), right flank (X 18-28).
// All trees at Y=0 (ground plane).
import { useMemo } from "react";
import type { GamePhase } from "@/hooks/useGamePhase";
import type { QualityLevel } from "@/hooks/useDeviceQuality";

type Props = { phase: GamePhase; quality?: QualityLevel };

type TreeDef = {
  id: number;
  x: number;
  z: number;
  height: number;
  radius: number;
  trunkColor: string;
  foliageColors: [string, string, string];
};

const TRUNK_COLORS = ["#3d2810", "#4a3218", "#2d2008", "#3a2512", "#522e10"];
const FOLIAGE_BASE = [
  ["#142010", "#1c2e14", "#0e1a0a"],
  ["#1a2810", "#203818", "#0a1e08"],
  ["#0e1c0c", "#162812", "#0c1808"],
  ["#182610", "#1e3416", "#101c08"],
] as const;

function makeTrees(count: number, seed = 42): TreeDef[] {
  let s = seed;
  const rand = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };

  return Array.from({ length: count }, (_, i) => {
    const cluster = Math.floor(rand() * 3);
    let x: number, z: number;

    if (cluster === 0) {
      // Front area — near spawn, Z 50-80, X scattered wide
      x = (rand() - 0.5) * 50;   // [-25, 25]
      z = 52 + rand() * 26;       // [52, 78]
    } else if (cluster === 1) {
      // Left flank
      x = -18 - rand() * 12;      // [-18, -30]
      z = -10 + rand() * 50;      // [-10, 40]
    } else {
      // Right flank
      x = 18 + rand() * 12;       // [18, 30]
      z = -10 + rand() * 50;      // [-10, 40]
    }

    const height = 2.5 + rand() * 3.0;
    const radius = 0.7 + rand() * 0.9;
    const trunkColor    = TRUNK_COLORS[Math.floor(rand() * TRUNK_COLORS.length)];
    const foliagePalette = FOLIAGE_BASE[Math.floor(rand() * FOLIAGE_BASE.length)];
    const foliageColors: [string, string, string] = [
      foliagePalette[0],
      foliagePalette[1],
      foliagePalette[2],
    ];

    return { id: i, x, z, height, radius, trunkColor, foliageColors };
  });
}

const TREE_COUNTS: Record<QualityLevel, number> = { high: 32, medium: 16, low: 8 };

// Easter egg — Liz nod. Small amber heart carved on a tree near the path.
// Placed at a specific position so it's discoverable but not immediately obvious.
const LizHeart = () => (
  <group position={[-7.5, 1.4, 60.5]} rotation={[0, -0.4, 0]} scale={[0.18, 0.18, 0.04]}>
    {/* Heart = two bumps + downward-pointing diamond */}
    <mesh position={[-0.6, 0.35, 0]}>
      <sphereGeometry args={[0.7, 12, 12]} />
      <meshStandardMaterial color="#C8860A" emissive="#9a6000" emissiveIntensity={0.4} roughness={0.8} />
    </mesh>
    <mesh position={[0.6, 0.35, 0]}>
      <sphereGeometry args={[0.7, 12, 12]} />
      <meshStandardMaterial color="#C8860A" emissive="#9a6000" emissiveIntensity={0.4} roughness={0.8} />
    </mesh>
    <mesh position={[0, -0.4, 0]} rotation={[0, 0, Math.PI / 4]}>
      <boxGeometry args={[0.9, 0.9, 0.5]} />
      <meshStandardMaterial color="#C8860A" emissive="#9a6000" emissiveIntensity={0.4} roughness={0.8} />
    </mesh>
  </group>
);

export const ForestBase = ({ phase, quality = "high" }: Props) => {
  const trees = useMemo(() => makeTrees(TREE_COUNTS[quality]), [quality]);
  if (phase !== "ascent") return null;

  return (
    <group>
      {/* Easter egg: Liz nod — a carved heart on the trunk of tree 3 (fixed position) */}
      <LizHeart />
      {trees.map(tree => (
        <group key={tree.id} position={[tree.x, 0, tree.z]}>
          {/* Trunk */}
          <mesh position={[0, tree.height * 0.18, 0]} castShadow>
            <cylinderGeometry args={[tree.radius * 0.35, tree.radius * 0.6, tree.height * 0.35, 6]} />
            <meshStandardMaterial color={tree.trunkColor} roughness={1} />
          </mesh>
          {/* 3 foliage tiers */}
          {([0, 1, 2] as const).map(tier => (
            <mesh
              key={tier}
              position={[0, tree.height * 0.28 + tier * tree.height * 0.2, 0]}
              castShadow
              receiveShadow
            >
              <coneGeometry args={[tree.radius * (1.2 - tier * 0.32), tree.height * 0.38, 7]} />
              <meshStandardMaterial color={tree.foliageColors[tier]} roughness={1} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
};
