import type { GamePhase } from "@/hooks/useGamePhase";
import { useMatcaps } from "@/hooks/useMatcaps";

const SUMMIT_Y = 80;

export const SummitLedge = ({ phase }: { phase: GamePhase }) => {
  const matcaps = useMatcaps();

  if (phase === "ascent") return null;

  return (
    <group position={[0, SUMMIT_Y - 0.5, -1]}>
      <mesh>
        <boxGeometry args={[10, 0.6, 4]} />
        <meshMatcapMaterial matcap={matcaps.stoneLight} />
      </mesh>
      <mesh position={[0, 0.35, 0]}>
        <boxGeometry args={[10, 0.1, 4]} />
        <meshMatcapMaterial matcap={matcaps.snow} />
      </mesh>
      {[-3.5, -1.5, 0, 2, 3.8].map((x, i) => (
        <mesh key={i} position={[x, 0.42, (i % 2 === 0 ? -0.5 : 0.5)]}>
          <sphereGeometry args={[0.2 + i * 0.05, 6, 4]} />
          <meshMatcapMaterial matcap={matcaps.snow} />
        </mesh>
      ))}
    </group>
  );
};
