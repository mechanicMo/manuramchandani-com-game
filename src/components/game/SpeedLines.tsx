// src/components/game/SpeedLines.tsx
// Horizontal white-blue streaks that rush past the camera during snowboard descent.
// Speed and opacity scale with lateral carving intensity for responsive feel.
import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { GamePhase } from "@/hooks/useGamePhase";

const COUNT = 22;

type Line = {
  localX: number;
  localY: number;
  localZ: number; // Z relative to character; moves from negative (ahead) toward positive (behind)
  baseSpeed: number;
  len: number;
};

const dummy = new THREE.Object3D();
dummy.matrixAutoUpdate = false;

type Props = {
  characterPos: THREE.Vector3;
  phase: GamePhase;
  velocityRef?: React.MutableRefObject<{ x: number; y: number }>;
};

export const SpeedLines = ({ characterPos, phase, velocityRef }: Props) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const matRef  = useRef<THREE.MeshBasicMaterial>(null);

  const lines = useMemo<Line[]>(() =>
    Array.from({ length: COUNT }, () => ({
      localX:    (Math.random() - 0.5) * 20,
      localY:    (Math.random() - 0.5) * 10,
      localZ:    (Math.random() - 0.5) * 30,
      baseSpeed: 16 + Math.random() * 10,
      len:       0.4 + Math.random() * 1.2,
    })),
  []);

  useFrame((_, delta) => {
    if (!meshRef.current || phase !== "descent") return;

    // carveIntensity: 0 = straight run, 1 = hard carve
    const lateralV = velocityRef ? Math.abs(velocityRef.current.x) : 0;
    const carveIntensity = Math.min(lateralV / 0.25, 1);
    const speedScale = 1 + carveIntensity * 2.2;

    // Update opacity imperatively so React doesn't need to re-render
    if (matRef.current) {
      matRef.current.opacity = 0.10 + carveIntensity * 0.30;
    }

    for (let i = 0; i < COUNT; i++) {
      const l = lines[i];
      l.localZ += l.baseSpeed * speedScale * delta;
      if (l.localZ > 18) {
        l.localZ    = -20 + Math.random() * 4;
        l.localX    = (Math.random() - 0.5) * 20;
        l.localY    = (Math.random() - 0.5) * 10;
        l.baseSpeed = 16 + Math.random() * 10;
        l.len       = 0.4 + Math.random() * 1.2;
      }

      dummy.position.set(
        characterPos.x + l.localX,
        characterPos.y + l.localY,
        characterPos.z + l.localZ,
      );
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(l.len, 1, 1);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  if (phase !== "descent") return null;

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]}>
      <planeGeometry args={[1.0, 0.007]} />
      <meshBasicMaterial
        ref={matRef}
        color="#c8deff"
        transparent
        opacity={0.10}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </instancedMesh>
  );
};
