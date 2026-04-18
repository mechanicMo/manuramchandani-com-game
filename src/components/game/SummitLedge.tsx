import type { GamePhase } from "@/hooks/useGamePhase";

const SUMMIT_Y = 80;

export const SummitLedge = ({ phase }: { phase: GamePhase }) => {
  if (phase === "ascent") return null;

  return (
    <group position={[0, SUMMIT_Y - 0.5, -1]}>
      {/* Main ledge platform */}
      <mesh receiveShadow castShadow>
        <boxGeometry args={[10, 0.6, 4]} />
        <meshStandardMaterial color="#ddeeff" roughness={0.9} metalness={0} />
      </mesh>
      {/* Snow drift on top */}
      <mesh position={[0, 0.35, 0]}>
        <boxGeometry args={[10, 0.1, 4]} />
        <meshStandardMaterial color="#f0f8ff" roughness={1} />
      </mesh>
      {/* Small snow mounds */}
      {[-3.5, -1.5, 0, 2, 3.8].map((x, i) => (
        <mesh key={i} position={[x, 0.42, (i % 2 === 0 ? -0.5 : 0.5)]} castShadow>
          <sphereGeometry args={[0.2 + i * 0.05, 6, 4]} />
          <meshStandardMaterial color="#f0f8ff" roughness={1} />
        </mesh>
      ))}
    </group>
  );
};
