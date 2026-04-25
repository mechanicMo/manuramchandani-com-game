// src/components/game/SummitObjects.tsx
// Non-interactive summit decorations: Beacon pyre.
// Monolith and SnowboardCache are rendered via LocationVisuals (they have location entries).
import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { CampfireFlame } from "./CampfireFlame";
import type { GamePhase } from "@/hooks/useGamePhase";

const SUMMIT_Y = 82;

type Props = { phase: GamePhase };

export const SummitObjects = ({ phase }: Props) => {
  if (phase === "ascent") return null;

  return (
    <group>
      <BeaconPyre />
      <SheraniSnowman />
    </group>
  );
};

// ── Summit Beacon — large signal-fire pyre ─────────────────────────────────────

const BeaconPyre = () => {
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame(({ clock }) => {
    if (!lightRef.current) return;
    const t = clock.getElapsedTime();
    lightRef.current.intensity =
      8 + Math.sin(t * 5.7) * 1.5 + Math.sin(t * 11.3) * 0.8;
  });

  return (
    <group position={[-4, SUMMIT_Y, -3]}>
      {/* Stone fire-ring base */}
      <mesh position={[0, 0.15, 0]} receiveShadow>
        <cylinderGeometry args={[0.9, 1.0, 0.3, 10]} />
        <meshStandardMaterial color="#5a6070" roughness={0.95} />
      </mesh>
      {/* Stone cap ring — darker inner lip */}
      <mesh position={[0, 0.32, 0]}>
        <torusGeometry args={[0.7, 0.12, 6, 12]} />
        <meshStandardMaterial color="#404858" roughness={0.98} />
      </mesh>

      {/* Log ring — 4 logs crossed */}
      {[0, 1, 2, 3].map(i => {
        const angle = (i / 4) * Math.PI;
        return (
          <mesh
            key={i}
            position={[Math.cos(angle) * 0.45, 0.45, Math.sin(angle) * 0.45]}
            rotation={[0, angle, Math.PI / 8]}
            castShadow
          >
            <cylinderGeometry args={[0.07, 0.09, 1.1, 6]} />
            <meshStandardMaterial color="#3a2810" roughness={1} />
          </mesh>
        );
      })}

      {/* Large flame — CampfireFlame scaled up */}
      <group position={[0, 0.5, 0]} scale={[1.8, 2.2, 1.8]}>
        <CampfireFlame />
      </group>

      {/* Strong flickering point light */}
      <pointLight
        ref={lightRef}
        position={[0, 2.5, 0]}
        color="#ff9020"
        intensity={8}
        distance={30}
        decay={2}
        castShadow
      />
    </group>
  );
};

// ── Sherani Snowman — easter egg at summit ─────────────────────────────────────
// Child-scaled (0.65x) snowman near the summit beacon. Thought-bubble appears on approach.
// Named "Sherani" (Mo's daughter) — a tiny nod no one but him will fully get.

const SNOW_WHITE = "#eef4ff";
const SNOW_SHADOW = "#c8d8f0";

const SheraniSnowman = () => {
  return (
    <group position={[3.5, SUMMIT_Y, -1]} scale={[0.65, 0.65, 0.65]}>
      {/* Bottom body */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <sphereGeometry args={[0.55, 12, 12]} />
        <meshStandardMaterial color={SNOW_WHITE} roughness={0.9} metalness={0} />
      </mesh>
      {/* Middle body */}
      <mesh position={[0, 1.28, 0]} castShadow>
        <sphereGeometry args={[0.40, 12, 12]} />
        <meshStandardMaterial color={SNOW_WHITE} roughness={0.9} metalness={0} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 1.92, 0]} castShadow>
        <sphereGeometry args={[0.28, 12, 12]} />
        <meshStandardMaterial color={SNOW_WHITE} roughness={0.9} metalness={0} />
      </mesh>
      {/* Eyes */}
      {[-0.08, 0.08].map((x, i) => (
        <mesh key={i} position={[x, 1.98, 0.26]} castShadow>
          <sphereGeometry args={[0.035, 8, 8]} />
          <meshStandardMaterial color="#1a1a2e" roughness={1} />
        </mesh>
      ))}
      {/* Carrot nose */}
      <mesh position={[0, 1.93, 0.3]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <coneGeometry args={[0.035, 0.14, 8]} />
        <meshStandardMaterial color="#e07020" roughness={0.8} />
      </mesh>
      {/* Scarf — amber to match brand */}
      <mesh position={[0, 1.67, 0]}>
        <torusGeometry args={[0.30, 0.055, 8, 20]} />
        <meshStandardMaterial color="#C8860A" roughness={0.8} />
      </mesh>
      {/* Arms — two sticks */}
      {[-1, 1].map((side, i) => (
        <mesh
          key={i}
          position={[side * 0.42, 1.38, 0]}
          rotation={[0, 0, side * -0.55]}
          castShadow
        >
          <cylinderGeometry args={[0.025, 0.018, 0.55, 5]} />
          <meshStandardMaterial color="#3d2810" roughness={1} />
        </mesh>
      ))}
      {/* Snow shadow disc */}
      <mesh position={[0, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.55, 16]} />
        <meshStandardMaterial color={SNOW_SHADOW} transparent opacity={0.35} depthWrite={false} />
      </mesh>
    </group>
  );
};

