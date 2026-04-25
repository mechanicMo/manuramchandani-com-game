// src/components/game/BoulderField.tsx
import { useMemo } from "react";
import type { GamePhase } from "@/hooks/useGamePhase";
import type { QualityLevel } from "@/hooks/useDeviceQuality";
import { useMatcaps } from "@/hooks/useMatcaps";
import { useMatcapWithGroundBounce } from "@/hooks/useMatcapWithGroundBounce";

type Props = {
  phase: GamePhase;
  quality?: QualityLevel;
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
    const cluster = Math.floor(rand() * 3);
    let x: number, z: number;

    if (cluster === 0) {
      x = (rand() - 0.5) * 38;
      z = 55 + rand() * 18;
    } else if (cluster === 1) {
      x = -(14 + rand() * 8);
      z = 15 + rand() * 38;
    } else {
      x = 14 + rand() * 8;
      z = 15 + rand() * 38;
    }

    const boulderCount = 3 + Math.floor(rand() * 3);
    const boulders = Array.from({ length: boulderCount }, () => {
      const radius = 0.5 + rand() * 1.2;
      const offsetY = -(radius * 0.35) + (rand() - 0.5) * 0.4;
      return {
        offset: [
          (rand() - 0.5) * 2.2,
          offsetY,
          (rand() - 0.5) * 1.8,
        ] as [number, number, number],
        radius,
      };
    });

    return { id: i, pos: [x, 0, z] as [number, number, number], boulders };
  });
}

const BOULDER_COUNTS: Record<QualityLevel, number> = { high: 16, medium: 10, low: 5 };

export const BoulderField = ({ phase, quality = "high" }: Props) => {
  const clusters  = useMemo(() => makeBoulderClusters(BOULDER_COUNTS[quality]), [quality]);
  const matcaps   = useMatcaps();
  const boulderMat = useMatcapWithGroundBounce(matcaps.stoneDark);

  if (phase === "descent") return null;

  return (
    <group>
      {clusters.map((cluster) => (
        <group key={cluster.id} position={cluster.pos}>
          {cluster.boulders.map((boulder, idx) => (
            <mesh
              key={idx}
              position={boulder.offset}
              material={boulderMat}
              castShadow
              receiveShadow
            >
              <dodecahedronGeometry args={[boulder.radius, 0]} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
};
