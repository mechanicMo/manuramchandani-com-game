// src/components/game/ForestBase.tsx
// Low-poly trees around the mountain base.
// Three clusters: front (Z 50-78 near spawn), left flank (X -18 to -28), right flank (X 18-28).
import { useMemo } from "react";
import type { GamePhase } from "@/hooks/useGamePhase";
import type { QualityLevel } from "@/hooks/useDeviceQuality";
import { useMatcaps } from "@/hooks/useMatcaps";

type Props = { phase: GamePhase; quality?: QualityLevel };

type TreeDef = {
  id: number;
  x: number;
  z: number;
  height: number;
  radius: number;
};

function makeTrees(count: number, seed = 42): TreeDef[] {
  let s = seed;
  const rand = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };

  return Array.from({ length: count }, (_, i) => {
    const cluster = Math.floor(rand() * 3);
    let x: number, z: number;

    if (cluster === 0) {
      x = (rand() - 0.5) * 50;
      z = 52 + rand() * 26;
    } else if (cluster === 1) {
      x = -18 - rand() * 12;
      z = -10 + rand() * 50;
    } else {
      x = 18 + rand() * 12;
      z = -10 + rand() * 50;
    }

    const height = 2.5 + rand() * 3.0;
    const radius = 0.7 + rand() * 0.9;

    return { id: i, x, z, height, radius };
  });
}

const TREE_COUNTS: Record<QualityLevel, number> = { high: 32, medium: 16, low: 8 };

// Easter egg — Liz nod. Small amber heart carved on a tree near the path.
const LizHeart = () => (
  <group position={[-7.5, 1.4, 60.5]} rotation={[0, -0.4, 0]} scale={[0.18, 0.18, 0.04]}>
    <mesh position={[-0.6, 0.35, 0]}>
      <sphereGeometry args={[0.7, 12, 12]} />
      <meshBasicMaterial color="#C8860A" />
    </mesh>
    <mesh position={[0.6, 0.35, 0]}>
      <sphereGeometry args={[0.7, 12, 12]} />
      <meshBasicMaterial color="#C8860A" />
    </mesh>
    <mesh position={[0, -0.4, 0]} rotation={[0, 0, Math.PI / 4]}>
      <boxGeometry args={[0.9, 0.9, 0.5]} />
      <meshBasicMaterial color="#C8860A" />
    </mesh>
  </group>
);

export const ForestBase = ({ phase, quality = "high" }: Props) => {
  const trees   = useMemo(() => makeTrees(TREE_COUNTS[quality]), [quality]);
  const matcaps = useMatcaps();

  if (phase !== "ascent") return null;

  return (
    <group>
      <LizHeart />
      {trees.map(tree => (
        <group key={tree.id} position={[tree.x, 0, tree.z]}>
          <mesh position={[0, tree.height * 0.18, 0]} castShadow>
            <cylinderGeometry args={[tree.radius * 0.35, tree.radius * 0.6, tree.height * 0.35, 6]} />
            <meshMatcapMaterial matcap={matcaps.wood} />
          </mesh>
          {([0, 1, 2] as const).map(tier => {
            const coneY  = tree.height * 0.28 + tier * tree.height * 0.2;
            const capY   = coneY + tree.height * 0.19;
            const capR   = tree.radius * (1.2 - tier * 0.32) * 0.22;
            return (
              <group key={tier}>
                <mesh position={[0, coneY, 0]} castShadow receiveShadow>
                  <coneGeometry args={[tree.radius * (1.2 - tier * 0.32), tree.height * 0.38, 10]} />
                  <meshMatcapMaterial matcap={matcaps.foliage} />
                </mesh>
                <mesh position={[0, capY, 0]}>
                  <sphereGeometry args={[capR, 6, 5]} />
                  <meshMatcapMaterial matcap={matcaps.snow} />
                </mesh>
              </group>
            );
          })}
        </group>
      ))}
    </group>
  );
};
