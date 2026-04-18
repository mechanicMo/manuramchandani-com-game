// src/components/game/DustParticles.tsx
import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const COUNT = 60;

export const DustParticles = ({ characterPos }: { characterPos: THREE.Vector3 }) => {
  const pts    = useRef<THREE.Points>(null);
  const speeds = useMemo(() => Float32Array.from({ length: COUNT }, () => 0.015 + Math.random() * 0.025), []);

  const positions = useMemo(() => {
    const arr = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      arr[i * 3]     = (Math.random() - 0.5) * 10;
      arr[i * 3 + 1] = Math.random() * 18;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 4;
    }
    return arr;
  }, []);

  useFrame(() => {
    if (!pts.current) return;
    const arr = pts.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < COUNT; i++) {
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
        <bufferAttribute attach="attributes-position" array={positions} count={COUNT} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.022} color="#8a7a68" transparent opacity={0.35} sizeAttenuation depthWrite={false} />
    </points>
  );
};
