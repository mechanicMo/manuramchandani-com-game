// src/components/game/HoldMarkers.tsx
import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export type Hold = { x: number; y: number; z: number };

export const HOLDS: Hold[] = [
  // climb_face_1 world: X[-11.9,10.3]  Y[3.5,78.7]  Z[35.8,44.2]; front surface at Z=+36
  { x: -3.0, y:  5, z: 36 }, { x:  4.5, y:  8, z: 36 },
  { x: -7.0, y: 12, z: 36 }, { x:  1.0, y: 15, z: 36 }, { x:  8.0, y: 18, z: 36 },
  { x: -4.0, y: 22, z: 36 }, { x:  6.0, y: 25, z: 36 },
  { x: -9.0, y: 30, z: 36 }, { x:  2.5, y: 34, z: 36 }, { x: -1.0, y: 38, z: 36 },
  { x:  7.0, y: 42, z: 36 }, { x: -5.5, y: 46, z: 36 }, { x:  3.0, y: 50, z: 36 },
  { x: -8.0, y: 54, z: 36 }, { x:  1.5, y: 58, z: 36 }, { x:  5.5, y: 62, z: 36 },
  { x: -2.5, y: 66, z: 36 }, { x:  9.0, y: 70, z: 36 },
  { x: -6.0, y: 74, z: 36 }, { x:  0.0, y: 78, z: 36 },
];

const COLOR_DEFAULT = new THREE.Color("#7a5e3a");
const COLOR_NEAR    = new THREE.Color("#C8860A");
const COLOR_FIRST   = new THREE.Color("#a06820"); // slightly brightened first hold for onboarding
const NEAR_DIST     = 2.5;

export const HoldMarkers = ({ characterPos }: { characterPos: THREE.Vector3 }) => {
  const mesh  = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame(({ clock }) => {
    if (!mesh.current) return;
    const t = clock.getElapsedTime();

    HOLDS.forEach((h, i) => {
      // Gentle float: each hold bobs at a slightly different phase
      const floatY = Math.sin(t * 1.4 + i * 0.65) * 0.10;
      const scale  = 1.0 + Math.sin(t * 1.8 + i * 0.5) * 0.06;

      dummy.position.set(h.x, h.y + floatY, h.z + 0.1);
      dummy.rotation.set(0.3, i * 0.7 + t * 0.25, 0.2);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      mesh.current!.setMatrixAt(i, dummy.matrix);

      const d = Math.hypot(characterPos.x - h.x, characterPos.y - h.y);
      const col = d < NEAR_DIST ? COLOR_NEAR : (i === 0 ? COLOR_FIRST : COLOR_DEFAULT);
      mesh.current!.setColorAt(i, col);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
    if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true;
  });

  return (
    <>
      <instancedMesh ref={mesh} args={[undefined, undefined, HOLDS.length]}>
        <dodecahedronGeometry args={[0.2, 0]} />
        <meshBasicMaterial vertexColors />
      </instancedMesh>
      {/* Persistent amber glow on hold #0 — visible from spawn, draws the eye to the climb */}
      <pointLight
        position={[HOLDS[0].x, HOLDS[0].y, HOLDS[0].z + 0.5]}
        color="#C8860A"
        intensity={1.2}
        distance={12}
        decay={2}
      />
    </>
  );
};
