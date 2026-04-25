import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { GamePhase } from "@/hooks/useGamePhase";

const SPEED_BASE  = 0.18;
const SPREAD_X    = 12;
const SPREAD_Z    = 6;
const RESET_ABOVE = 16;
const RESET_BELOW = -6;

type Props = { characterPos: THREE.Vector3; phase: GamePhase; count?: number };

export const SnowParticles = ({ characterPos, phase, count = 120 }: Props) => {
  const pts      = useRef<THREE.Points>(null);
  const phaseRef = useRef<GamePhase>(phase);
  const speeds   = useMemo(() => Float32Array.from({ length: count }, () => SPEED_BASE + Math.random() * 0.12), [count]);
  const drifts   = useMemo(() => Float32Array.from({ length: count }, () => (Math.random() - 0.5) * 0.008), [count]);

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3]     = (Math.random() - 0.5) * SPREAD_X;
      arr[i * 3 + 1] = Math.random() * 20;
      arr[i * 3 + 2] = (Math.random() - 0.5) * SPREAD_Z;
    }
    return arr;
  }, [count]);

  useFrame(() => {
    if (!pts.current) return;
    const arr = pts.current.geometry.attributes.position.array as Float32Array;

    // On transition to summit: scatter particles above/around character
    if (phaseRef.current !== "summit" && phase === "summit") {
      for (let i = 0; i < count; i++) {
        arr[i * 3]     = characterPos.x + (Math.random() - 0.5) * SPREAD_X * 1.5;
        arr[i * 3 + 1] = characterPos.y + Math.random() * 16;
        arr[i * 3 + 2] = characterPos.z + (Math.random() - 0.5) * SPREAD_Z * 1.5;
      }
    }
    phaseRef.current = phase;

    if (phase === "descent") {
      // Snow spray — particles rush upward past the descending rider
      for (let i = 0; i < count; i++) {
        arr[i * 3 + 1] += speeds[i];
        arr[i * 3]     += drifts[i];
        if (arr[i * 3 + 1] > characterPos.y + RESET_ABOVE) {
          arr[i * 3]     = characterPos.x + (Math.random() - 0.5) * SPREAD_X;
          arr[i * 3 + 1] = characterPos.y + RESET_BELOW;
          arr[i * 3 + 2] = characterPos.z + (Math.random() - 0.5) * SPREAD_Z;
        }
      }
    } else if (phase === "summit") {
      // Snowflakes drifting down — atmospheric summit snow
      for (let i = 0; i < count; i++) {
        arr[i * 3 + 1] -= speeds[i] * 0.45;
        arr[i * 3]     += drifts[i] * 2.5;
        if (arr[i * 3 + 1] < characterPos.y - 8) {
          arr[i * 3]     = characterPos.x + (Math.random() - 0.5) * SPREAD_X * 1.5;
          arr[i * 3 + 1] = characterPos.y + 14;
          arr[i * 3 + 2] = characterPos.z + (Math.random() - 0.5) * SPREAD_Z * 1.5;
        }
      }
    }

    pts.current.geometry.attributes.position.needsUpdate = true;
  });

  if (phase === "ascent") return null;

  return (
    <points ref={pts}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={positions} count={count} itemSize={3} />
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
