// src/components/game/SpeedLines.tsx
// Horizontal white-blue streaks that rush past the camera during snowboard descent.
// Creates the impression of speed without needing motion blur post-processing.
import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { GamePhase } from "@/hooks/useGamePhase";

const COUNT = 22;

type Line = {
  localX: number;
  localY: number;
  localZ: number; // Z relative to character; moves from negative (ahead) toward positive (behind)
  speed: number;
  len: number;
};

const dummy = new THREE.Object3D();

type Props = {
  characterPos: THREE.Vector3;
  phase: GamePhase;
};

export const SpeedLines = ({ characterPos, phase }: Props) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const lines = useMemo<Line[]>(() =>
    Array.from({ length: COUNT }, () => ({
      localX: (Math.random() - 0.5) * 20,
      localY: (Math.random() - 0.5) * 10,
      localZ: (Math.random() - 0.5) * 30,
      speed:  16 + Math.random() * 10,
      len:    0.4 + Math.random() * 1.2,
    })),
  []);

  useFrame((_, delta) => {
    if (!meshRef.current || phase !== "descent") return;

    for (let i = 0; i < COUNT; i++) {
      const l = lines[i];
      l.localZ += l.speed * delta; // move behind the character (+Z is toward camera)
      if (l.localZ > 18) {
        // Reset ahead of the character
        l.localZ    = -20 + Math.random() * 4;
        l.localX    = (Math.random() - 0.5) * 20;
        l.localY    = (Math.random() - 0.5) * 10;
        l.speed     = 16 + Math.random() * 10;
        l.len       = 0.4 + Math.random() * 1.2;
      }

      dummy.position.set(
        characterPos.x + l.localX,
        characterPos.y + l.localY,
        characterPos.z + l.localZ,
      );
      dummy.rotation.set(0, 0, 0); // horizontal plane, Z-oriented
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
        color="#c8deff"
        transparent
        opacity={0.28}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </instancedMesh>
  );
};
