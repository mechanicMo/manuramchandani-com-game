// src/components/game/HoldMarkers.tsx
import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export type Hold = { x: number; y: number; z: number };

export const HOLDS: Hold[] = [
  // climb_face_1: world X[-11,11]  Y[5,78]  Z≈36 (4 units behind surface at Z≈40)
  { x: -3.0, y:  5, z: 36 }, { x:  4.5, y:  8, z: 36 },
  { x: -7.0, y: 12, z: 36 }, { x:  1.0, y: 15, z: 36 }, { x:  8.0, y: 18, z: 36 },
  { x: -4.0, y: 22, z: 36 }, { x:  6.0, y: 25, z: 36 },
  { x: -9.0, y: 30, z: 36 }, { x:  2.5, y: 34, z: 36 }, { x: -1.0, y: 38, z: 36 },
  { x:  7.0, y: 42, z: 36 }, { x: -5.5, y: 46, z: 36 }, { x:  3.0, y: 50, z: 36 },
  { x: -8.0, y: 54, z: 36 }, { x:  1.5, y: 58, z: 36 }, { x:  5.5, y: 62, z: 36 },
  { x: -2.5, y: 66, z: 36 }, { x:  9.0, y: 70, z: 36 },
  { x: -6.0, y: 74, z: 36 }, { x:  0.0, y: 78, z: 36 },

  // climb_face_2: world X[-45,-25]  Y[5,77]  Z≈11 (4 units behind surface at Z≈15)
  { x: -35, y:  8, z: 11 }, { x: -27, y: 12, z: 11 },
  { x: -43, y: 17, z: 11 }, { x: -33, y: 22, z: 11 }, { x: -26, y: 27, z: 11 },
  { x: -39, y: 32, z: 11 }, { x: -30, y: 37, z: 11 },
  { x: -44, y: 43, z: 11 }, { x: -34, y: 48, z: 11 }, { x: -27, y: 54, z: 11 },
  { x: -41, y: 60, z: 11 }, { x: -32, y: 66, z: 11 },
  { x: -36, y: 72, z: 11 },

  // climb_face_hidden: world X[18,32]  Y[5,75]  Z≈-39 (4 units behind surface at Z≈-35)
  { x: 25, y:  8, z: -39 }, { x: 30, y: 13, z: -39 },
  { x: 19, y: 19, z: -39 }, { x: 27, y: 25, z: -39 }, { x: 31, y: 31, z: -39 },
  { x: 21, y: 37, z: -39 }, { x: 28, y: 43, z: -39 },
  { x: 18, y: 49, z: -39 }, { x: 25, y: 55, z: -39 },
  { x: 30, y: 62, z: -39 }, { x: 22, y: 68, z: -39 },
];

const COLOR_DEFAULT = new THREE.Color("#9a7848");
const COLOR_NEAR    = new THREE.Color("#FFD060");  // bright enough to bloom
const COLOR_FIRST   = new THREE.Color("#E09828");  // entry hold — more visible than others
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
      {/* face_1 entry glow — visible from spawn */}
      <pointLight
        position={[HOLDS[0].x, HOLDS[0].y, HOLDS[0].z + 0.5]}
        color="#FFB830"
        intensity={3.0}
        distance={20}
        decay={2}
      />
      {/* face_2 entry glow — draws the eye when walking the left side of the base */}
      <pointLight
        position={[-35, 8, 11.5]}
        color="#C8860A"
        intensity={0.9}
        distance={14}
        decay={2}
      />
      {/* face_hidden entry glow — subtle, rewards exploration */}
      <pointLight
        position={[25, 8, -38.5]}
        color="#C8860A"
        intensity={0.7}
        distance={10}
        decay={2}
      />
    </>
  );
};
