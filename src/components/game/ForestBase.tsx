// src/components/game/ForestBase.tsx
import { useMemo } from "react";
import * as THREE from "three";
import type { GamePhase } from "@/hooks/useGamePhase";

type Props = {
  phase: GamePhase;
};

type Tree = {
  id: number;
  pos: [number, number, number];
  height: number;
};

function makeTrees(count: number, seed = 123): Tree[] {
  let s = seed;
  const rand = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };

  return Array.from({ length: count }, (_, i) => {
    const height = 1.5 + rand() * 1.7; // 1.5 to 3.2
    const xLeft = rand() < 0.5;
    const x = xLeft ? -16 + rand() * 9 : 7 + rand() * 8; // [-16, -7] or [7, 15]
    const y = -0.5 + rand() * 38.5; // [-0.5, 38]
    const z = -3 + rand() * 4; // [-3, 1]

    return {
      id: i,
      pos: [x, y, z] as [number, number, number],
      height,
    };
  });
}

export const ForestBase = ({ phase }: Props) => {
  if (phase !== "ascent") return null;

  const trees = useMemo(() => makeTrees(14), []);

  return (
    <group>
      {trees.map((tree) => (
        <group key={tree.id} position={tree.pos}>
          {/* Trunk */}
          <mesh position={[0, (tree.height * 0.3) / 2, 0]} castShadow>
            <cylinderGeometry args={[0.12, 0.18, tree.height * 0.3, 6]} />
            <meshStandardMaterial color="#1a1008" roughness={1} metalness={0} />
          </mesh>

          {/* Foliage layer 1 (bottom, widest) */}
          <mesh
            position={[0, tree.height * 0.3 + tree.height * 0.15, 0]}
            castShadow
            receiveShadow
          >
            <coneGeometry
              args={[
                tree.height * 0.4,
                tree.height * 0.35,
                7,
              ]}
            />
            <meshStandardMaterial color="#0f2010" roughness={1} metalness={0} />
          </mesh>

          {/* Foliage layer 2 (middle) */}
          <mesh
            position={[0, tree.height * 0.45 + tree.height * 0.2, 0]}
            castShadow
            receiveShadow
          >
            <coneGeometry
              args={[
                tree.height * 0.28,
                tree.height * 0.3,
                7,
              ]}
            />
            <meshStandardMaterial color="#152818" roughness={1} metalness={0} />
          </mesh>

          {/* Foliage layer 3 (top, narrowest) */}
          <mesh
            position={[0, tree.height * 0.65 + tree.height * 0.15, 0]}
            castShadow
            receiveShadow
          >
            <coneGeometry
              args={[
                tree.height * 0.18,
                tree.height * 0.25,
                6,
              ]}
            />
            <meshStandardMaterial color="#1a3020" roughness={1} metalness={0} />
          </mesh>
        </group>
      ))}
    </group>
  );
};
