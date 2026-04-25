// src/components/game/DustParticles.tsx
import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

type Props = { characterPos: THREE.Vector3; count?: number };

export const DustParticles = ({ characterPos, count = 60 }: Props) => {
  const pts    = useRef<THREE.Points>(null);
  const speeds = useMemo(() => Float32Array.from({ length: count }, () => 0.015 + Math.random() * 0.025), [count]);

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3]     = (Math.random() - 0.5) * 10;
      arr[i * 3 + 1] = Math.random() * 18;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 4;
    }
    return arr;
  }, [count]);

  useFrame(() => {
    if (!pts.current) return;
    const arr = pts.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 1] += speeds[i];
      if (arr[i * 3 + 1] > characterPos.y + 14) {
        arr[i * 3]     = characterPos.x + (Math.random() - 0.5) * 10;
        arr[i * 3 + 1] = characterPos.y - 6;
        arr[i * 3 + 2] = (Math.random() - 0.5) * 4;
      }
    }
    pts.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pts}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={positions} count={count} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.022} color="#8a7a68" transparent opacity={0.35} sizeAttenuation depthWrite={false} />
    </points>
  );
};
