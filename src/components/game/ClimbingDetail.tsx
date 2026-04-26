// src/components/game/ClimbingDetail.tsx
// Decorative climbing details on the mountain face: rope segments, chalk marks, pitons.
// Updated to use full 3D hold positions (z≈36 on the mountain's front climb face).
import { useMemo, useRef, useEffect } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { HOLDS } from "./HoldMarkers";
import type { GamePhase } from "@/hooks/useGamePhase";

type Props = { phase: GamePhase };

// Pairs of adjacent hold indices to connect with rope — zigzag across the face
const ROPE_PAIRS: [number, number][] = [
  [0, 2], [1, 3], [3, 5], [4, 6],
  [6, 8], [7, 9], [9, 11], [10, 12],
  [12, 14], [13, 15], [15, 17], [16, 18],
];

// Holds that get chalk smears
const CHALK_HOLDS = [1, 3, 5, 7, 9, 11, 13, 15, 17];

function makePitons(seed = 234) {
  let s = seed;
  const rand = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
  return Array.from({ length: 5 }, (_, i) => ({
    id: i,
    x: (rand() - 0.5) * 16,
    y: 5 + rand() * 68,
    z: 36.15,
    rotZ: rand() * Math.PI,
  }));
}

// Module-level shared materials and geometries — created once, never re-allocated
const _dummy    = new THREE.Object3D();
_dummy.matrixAutoUpdate = false;

const ROPE_MAT  = new THREE.MeshBasicMaterial({ color: "#7a6035" });
const CHALK_GEO = new THREE.CircleGeometry(0.22, 7);
const CHALK_MAT = new THREE.MeshBasicMaterial({
  color: "white", transparent: true, opacity: 0.28,
  side: THREE.DoubleSide, depthWrite: false,
});
const PITON_GEO = new THREE.CylinderGeometry(0.025, 0.02, 0.28, 5);
const PITON_MAT = new THREE.MeshBasicMaterial({ color: "#5a5040" });

export const ClimbingDetail = ({ phase }: Props) => {
  const mergedRopeGeo = useMemo(() => {
    const geos = ROPE_PAIRS.map(([ai, bi]) => {
      const a = HOLDS[ai];
      const b = HOLDS[bi];
      if (!a || !b) return null;
      const mid = new THREE.Vector3(
        (a.x + b.x) / 2,
        Math.min(a.y, b.y) - 1.0,
        a.z - 0.3,
      );
      const curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(a.x, a.y, a.z + 0.05),
        mid,
        new THREE.Vector3(b.x, b.y, b.z + 0.05),
      );
      return new THREE.TubeGeometry(curve, 14, 0.025, 5, false);
    }).filter(Boolean) as THREE.TubeGeometry[];
    return geos.length > 0 ? mergeGeometries(geos) : null;
  }, []);

  const pitons = useMemo(() => makePitons(), []);

  const chalkRef = useRef<THREE.InstancedMesh>(null!);
  const pitonRef = useRef<THREE.InstancedMesh>(null!);

  useEffect(() => {
    if (chalkRef.current) {
      CHALK_HOLDS.forEach((hi, i) => {
        const h = HOLDS[hi];
        if (!h) return;
        _dummy.position.set(
          h.x + (hi % 2 === 0 ? 0.2 : -0.15),
          h.y - 0.25,
          h.z - 0.05,
        );
        _dummy.rotation.set(0, 0, 0);
        _dummy.updateMatrix();
        chalkRef.current.setMatrixAt(i, _dummy.matrix);
      });
      chalkRef.current.instanceMatrix.needsUpdate = true;
    }
    if (pitonRef.current) {
      pitons.forEach((p, i) => {
        _dummy.position.set(p.x, p.y, p.z);
        _dummy.rotation.set(0, 0, p.rotZ);
        _dummy.updateMatrix();
        pitonRef.current.setMatrixAt(i, _dummy.matrix);
      });
      pitonRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [pitons]);

  if (phase !== "ascent") return null;

  return (
    <group>
      {/* Rope segments — 12 unique tube paths merged into 1 draw call */}
      {mergedRopeGeo && <mesh geometry={mergedRopeGeo} material={ROPE_MAT} />}

      {/* Chalk smears and pitons batched into InstancedMesh (9 + 5 → 2 draw calls) */}
      <instancedMesh ref={chalkRef} args={[CHALK_GEO, CHALK_MAT, CHALK_HOLDS.length]} />
      <instancedMesh ref={pitonRef} args={[PITON_GEO, PITON_MAT, pitons.length]} />
    </group>
  );
};
