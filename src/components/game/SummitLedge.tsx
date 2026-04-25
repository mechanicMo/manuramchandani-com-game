import type { GamePhase } from "@/hooks/useGamePhase";
import { useMatcaps } from "@/hooks/useMatcaps";

const SUMMIT_Y = 82;

export const SummitLedge = ({ phase }: { phase: GamePhase }) => {
  const matcaps = useMatcaps();

  if (phase === "ascent") return null;

  return (
    <group>
      {/* Main plateau — wide stone base the character stands on */}
      <mesh position={[0, SUMMIT_Y - 1, 0]}>
        <boxGeometry args={[22, 2, 18]} />
        <meshMatcapMaterial matcap={matcaps.stoneLight} />
      </mesh>
      {/* Snow cover on plateau */}
      <mesh position={[0, SUMMIT_Y + 0.06, 0]}>
        <boxGeometry args={[22, 0.14, 18]} />
        <meshMatcapMaterial matcap={matcaps.snow} />
      </mesh>
      {/* Irregular snow drifts — lumpy snow surface detail */}
      {[
        [-7.5, 0,  -5], [-3, 0, -6], [6, 0, -5.5],
        [-8,   0,   3], [ 4, 0,  4], [8, 0,  2  ],
        [ 1,   0,  -2],
      ].map(([x, , z], i) => (
        <mesh key={i} position={[x as number, SUMMIT_Y + 0.08, z as number]}>
          <sphereGeometry args={[0.35 + (i % 3) * 0.14, 6, 4]} />
          <meshMatcapMaterial matcap={matcaps.snow} />
        </mesh>
      ))}
      {/* Edge outcrop rocks — give the summit rim an organic feel */}
      {[
        [-10, SUMMIT_Y - 0.2,  -8], [10, SUMMIT_Y - 0.3, -7],
        [-9,  SUMMIT_Y - 0.1,   7], [9,  SUMMIT_Y - 0.2,  6],
        [-5,  SUMMIT_Y - 0.5, -10], [5,  SUMMIT_Y - 0.4, -9],
      ].map(([x, y, z], i) => (
        <mesh key={i} position={[x as number, y as number, z as number]} castShadow>
          <dodecahedronGeometry args={[0.5 + (i % 3) * 0.2, 0]} />
          <meshMatcapMaterial matcap={matcaps.stoneDark} />
        </mesh>
      ))}
    </group>
  );
};
