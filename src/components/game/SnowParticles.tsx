import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { GamePhase } from "@/hooks/useGamePhase";

const COUNT = 120;
const SPEED_BASE  = 0.18;
const SPREAD_X    = 12;
const SPREAD_Z    = 6;
const RESET_ABOVE = 16;
const RESET_BELOW = -6;

export const SnowParticles = ({ characterPos, phase }: { characterPos: THREE.Vector3; phase: GamePhase }) => {
  const pts    = useRef<THREE.Points>(null);
  const speeds = useMemo(() => Float32Array.from({ length: COUNT }, () => SPEED_BASE + Math.random() * 0.12), []);
  const drifts = useMemo(() => Float32Array.from({ length: COUNT }, () => (Math.random() - 0.5) * 0.008), []);

  const positions = useMemo(() => {
    const arr = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      arr[i * 3]     = (Math.random() - 0.5) * SPREAD_X;
      arr[i * 3 + 1] = Math.random() * 20;
      arr[i * 3 + 2] = (Math.random() - 0.5) * SPREAD_Z;
    }
    return arr;
  }, []);

  useFrame(() => {
    if (!pts.current || phase !== "descent") return;
    const arr = pts.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < COUNT; i++) {
      // Particles stream upward (descent illusion)
      arr[i * 3 + 1] += speeds[i];
      arr[i * 3]     += drifts[i];

      // Reset below -> back above character
      if (arr[i * 3 + 1] > characterPos.y + RESET_ABOVE) {
        arr[i * 3]     = characterPos.x + (Math.random() - 0.5) * SPREAD_X;
        arr[i * 3 + 1] = characterPos.y + RESET_BELOW;
        arr[i * 3 + 2] = (Math.random() - 0.5) * SPREAD_Z;
      }
    }
    pts.current.geometry.attributes.position.needsUpdate = true;
  });

  if (phase === "ascent") return null;

  return (
    <points ref={pts}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={positions} count={COUNT} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        color="#f0f8ff"
        transparent
        opacity={0.8}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
};
