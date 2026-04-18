// src/components/game/HoldMarkers.tsx
import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export type Hold = { x: number; y: number; z: number };

export const HOLDS: Hold[] = [
  { x:  0.0, y:  3, z: 0 }, { x: -1.2, y:  7, z: 0 },
  { x:  1.5, y: 12, z: 0 }, { x:  0.4, y: 17, z: 0 },
  { x: -1.8, y: 22, z: 0 }, { x:  1.0, y: 27, z: 0 },
  { x: -0.6, y: 32, z: 0 }, { x:  2.0, y: 37, z: 0 },
  { x: -1.4, y: 41, z: 0 }, { x:  0.8, y: 46, z: 0 },
  { x: -2.0, y: 51, z: 0 }, { x:  1.3, y: 56, z: 0 },
  { x: -0.8, y: 61, z: 0 }, { x:  1.8, y: 65, z: 0 },
  { x: -1.0, y: 69, z: 0 }, { x:  0.4, y: 73, z: 0 },
  { x: -1.5, y: 77, z: 0 }, { x:  0.0, y: 80, z: 0 },
];

const COLOR_DEFAULT = new THREE.Color("#5a4232");
const COLOR_NEAR    = new THREE.Color("#C8860A");
const NEAR_DIST     = 2.5;

export const HoldMarkers = ({ characterPos }: { characterPos: THREE.Vector3 }) => {
  const mesh  = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame(() => {
    if (!mesh.current) return;
    HOLDS.forEach((h, i) => {
      dummy.position.set(h.x, h.y, h.z + 0.08);
      dummy.rotation.set(0.3, i * 0.7, 0.2);
      dummy.updateMatrix();
      mesh.current!.setMatrixAt(i, dummy.matrix);

      const d = Math.hypot(characterPos.x - h.x, characterPos.y - h.y);
      mesh.current!.setColorAt(i, d < NEAR_DIST ? COLOR_NEAR : COLOR_DEFAULT);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
    if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, HOLDS.length]} castShadow>
      <dodecahedronGeometry args={[0.2, 0]} />
      <meshStandardMaterial roughness={0.7} metalness={0.2} />
    </instancedMesh>
  );
};
