// src/components/game/HoldMarkers.tsx
import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useMatcaps } from "@/hooks/useMatcaps";

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

// instanceColor no-ops with MeshMatcapMaterial (known G12 regression — fix in G18)
const COLOR_DEFAULT = new THREE.Color("#8a6a4a");
const COLOR_NEAR    = new THREE.Color("#C8860A");
const NEAR_DIST     = 2.5;

export const HoldMarkers = ({ characterPos }: { characterPos: THREE.Vector3 }) => {
  const mesh    = useRef<THREE.InstancedMesh>(null);
  const dummy   = useMemo(() => new THREE.Object3D(), []);
  const matcaps = useMatcaps();

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
      <meshMatcapMaterial matcap={matcaps.metalSoft} />
    </instancedMesh>
  );
};
