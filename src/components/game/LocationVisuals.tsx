// src/components/game/LocationVisuals.tsx
import { useMemo, memo } from "react";
import { LOCATIONS } from "@/data/locations";
import type { GamePhase } from "@/hooks/useGamePhase";

type Props = { phase: GamePhase };

export const LocationVisuals = ({ phase }: Props) => {
  const locations = useMemo(
    () => LOCATIONS.filter(loc => loc.phase === phase),
    [phase]
  );

  return (
    <>
      {locations.map(loc => (
        <LocationVisual key={loc.id} y={loc.y} visualType={loc.visualType} />
      ))}
    </>
  );
};

const LocationVisual = memo(({ y, visualType }: { y: number; visualType: string }) => {
  switch (visualType) {
    case "campfire":
      return (
        <group position={[-4, y, 0]}>
          <mesh>
            <cylinderGeometry args={[0.3, 0.5, 0.15, 6]} />
            <meshStandardMaterial color="#8B4513" roughness={1} />
          </mesh>
          <mesh position={[0, 0.3, 0]}>
            <coneGeometry args={[0.2, 0.5, 5]} />
            <meshStandardMaterial color="#FF4500" emissive="#FF2200" emissiveIntensity={0.8} />
          </mesh>
          <pointLight position={[0, 0.5, 0]} color="#FF6600" intensity={2} distance={6} />
        </group>
      );

    case "laptop":
      return (
        <group position={[-4, y, 0]}>
          <mesh>
            <boxGeometry args={[1.2, 0.08, 0.8]} />
            <meshStandardMaterial color="#2a2a2a" metalness={0.7} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.5, -0.36]} rotation={[-0.3, 0, 0]}>
            <boxGeometry args={[1.2, 0.75, 0.05]} />
            <meshStandardMaterial color="#1a1a1a" />
          </mesh>
          <mesh position={[0, 0.5, -0.33]} rotation={[-0.3, 0, 0]}>
            <boxGeometry args={[1.0, 0.6, 0.01]} />
            <meshStandardMaterial color="#C8860A" emissive="#C8860A" emissiveIntensity={0.6} />
          </mesh>
          <pointLight position={[0, 0.6, 0]} color="#C8860A" intensity={1.5} distance={5} />
        </group>
      );

    case "mac-mini":
      return (
        <group position={[-4, y, 0]}>
          <mesh>
            <boxGeometry args={[0.8, 0.2, 0.8]} />
            <meshStandardMaterial color="#1a1a1a" metalness={0.8} roughness={0.2} />
          </mesh>
          {[0, 1, 2].map(i => (
            <mesh key={i} position={[1.2, 0.15 * i, 0]}>
              <boxGeometry args={[0.6, 0.08, 0.4]} />
              <meshStandardMaterial
                color={i % 2 === 0 ? "#FAF8F4" : "#e0ddd6"}
                roughness={0.9}
              />
            </mesh>
          ))}
          <pointLight position={[0, 1, 0]} color="#4488ff" intensity={1} distance={5} />
        </group>
      );

    case "champion-slabs":
      return (
        <group position={[-4, y, 0]}>
          {[-0.7, 0, 0.7].map((x, i) => (
            <mesh key={i} position={[x, 0.6 + i * 0.1, 0]}>
              <boxGeometry args={[0.35, 1.2 + i * 0.1, 0.15]} />
              <meshStandardMaterial
                color="#1a1a2e"
                emissive="#3b82f6"
                emissiveIntensity={0.2}
                roughness={0.6}
              />
            </mesh>
          ))}
          <pointLight position={[0, 1, 0]} color="#3b82f6" intensity={1} distance={5} />
        </group>
      );

    case "bjj-gear":
      return (
        <group position={[-4, y, 0]}>
          <mesh rotation={[0, 0, 0.1]}>
            <boxGeometry args={[0.6, 1.2, 0.05]} />
            <meshStandardMaterial color="#FFFFFF" roughness={0.9} />
          </mesh>
          <mesh position={[0.8, -0.2, 0]}>
            <cylinderGeometry args={[0.18, 0.15, 0.35, 8]} />
            <meshStandardMaterial color="#2d2d2d" roughness={0.8} />
          </mesh>
          <mesh position={[0.8, 0, 0]}>
            <sphereGeometry args={[0.12, 6, 4]} />
            <meshStandardMaterial color="#f5f5f5" transparent opacity={0.6} />
          </mesh>
        </group>
      );

    case "phone-scout":
      return (
        <group position={[-4, y, 0]}>
          <mesh>
            <boxGeometry args={[0.5, 1.0, 0.07]} />
            <meshStandardMaterial color="#1a1a1a" metalness={0.5} roughness={0.4} />
          </mesh>
          <mesh position={[0, 0, 0.04]}>
            <boxGeometry args={[0.42, 0.88, 0.01]} />
            <meshStandardMaterial color="#0f172a" emissive="#60a5fa" emissiveIntensity={0.3} />
          </mesh>
          <pointLight position={[0, 0, 0.5]} color="#60a5fa" intensity={1} distance={4} />
        </group>
      );

    case "phone-seedling":
      return (
        <group position={[-4, y, 0]}>
          <mesh>
            <boxGeometry args={[0.5, 1.0, 0.07]} />
            <meshStandardMaterial color="#1a1a1a" metalness={0.5} roughness={0.4} />
          </mesh>
          <mesh position={[0, 0, 0.04]}>
            <boxGeometry args={[0.42, 0.88, 0.01]} />
            <meshStandardMaterial color="#0f2d1a" emissive="#4ade80" emissiveIntensity={0.3} />
          </mesh>
          <pointLight position={[0, 0, 0.5]} color="#4ade80" intensity={1} distance={4} />
        </group>
      );

    case "map-pins":
      return (
        <group position={[-4, y, 0]}>
          {[-0.6, 0, 0.6].map((x, i) => (
            <group key={i} position={[x, i * 0.2, 0]}>
              <mesh position={[0, 0.5, 0]}>
                <sphereGeometry args={[0.15, 8, 6]} />
                <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.4} />
              </mesh>
              <mesh>
                <coneGeometry args={[0.05, 0.5, 6]} />
                <meshStandardMaterial color="#b91c1c" />
              </mesh>
            </group>
          ))}
          <pointLight position={[0, 0.5, 0]} color="#ef4444" intensity={1} distance={5} />
        </group>
      );

    case "slalom-gate":
      return (
        <group position={[0, y, 0]}>
          <mesh position={[-3.5, 0, 0]}>
            <cylinderGeometry args={[0.07, 0.07, 3, 8]} />
            <meshStandardMaterial color="#ff6600" emissive="#ff4400" emissiveIntensity={0.5} />
          </mesh>
          <mesh position={[3.5, 0, 0]}>
            <cylinderGeometry args={[0.07, 0.07, 3, 8]} />
            <meshStandardMaterial color="#ff6600" emissive="#ff4400" emissiveIntensity={0.5} />
          </mesh>
          <mesh position={[0, 1.4, 0]}>
            <boxGeometry args={[7, 0.08, 0.08]} />
            <meshStandardMaterial color="#ff6600" emissive="#ff4400" emissiveIntensity={0.6} />
          </mesh>
          <pointLight position={[0, 1, 0]} color="#ff6600" intensity={1.5} distance={8} />
        </group>
      );

    case "snow-text":
      // No 3D object — content rendered as HTML overlay in LocationOverlay
      return null;

    case "lit-ground":
      return (
        <group position={[0, y - 0.1, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[12, 8]} />
            <meshStandardMaterial color="#ddeeff" emissive="#aaccff" emissiveIntensity={0.15} roughness={0.9} />
          </mesh>
          <pointLight position={[0, 1, 0]} color="#aaccff" intensity={1} distance={10} />
        </group>
      );

    default:
      return null;
  }
});
