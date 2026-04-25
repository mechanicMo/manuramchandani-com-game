// src/components/game/StarField.tsx
// Night sky stars — visible at summit and fade in during ascent above y=60.
import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { GamePhase } from "@/hooks/useGamePhase";
import type { QualityLevel } from "@/hooks/useDeviceQuality";

type Props = { phase: GamePhase; characterY?: number; quality?: QualityLevel };

export const StarField = ({ phase, characterY = 0, quality = "high" }: Props) => {
  const count = quality === "low" ? 0 : quality === "medium" ? 140 : 280;
  const ptsRef = useRef<THREE.Points>(null);
  const opacityRef = useRef(0);

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const phi   = Math.random() * Math.PI * 2;
      const cosT  = 0.05 + Math.random() * 0.95; // upper hemisphere, avoid horizon
      const sinT  = Math.sqrt(1 - cosT * cosT);
      const r     = 380 + Math.random() * 220;
      arr[i * 3]     = r * sinT * Math.cos(phi);
      arr[i * 3 + 1] = r * cosT + 40;
      arr[i * 3 + 2] = r * sinT * Math.sin(phi);
    }
    return arr;
  }, [count]);

  useFrame((_, delta) => {
    if (!ptsRef.current) return;
    let target = 0;
    if (phase === "summit") {
      target = 0.9;
    } else if (phase === "ascent" && characterY > 55) {
      // Fade in stars as player climbs high
      target = ((characterY - 55) / 25) * 0.5;
    }
    opacityRef.current += (target - opacityRef.current) * Math.min(delta * 0.6, 1);
    (ptsRef.current.material as THREE.PointsMaterial).opacity = opacityRef.current;
  });

  if (count === 0 || phase === "descent") return null;

  return (
    <points ref={ptsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={positions} count={count} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={1.8}
        color="#dde8ff"
        transparent
        opacity={0}
        sizeAttenuation={false}
        depthWrite={false}
      />
    </points>
  );
};
