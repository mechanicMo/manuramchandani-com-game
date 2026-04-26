// src/components/game/MineralVeins.tsx
// Amber circuit veins embedded in the rock face — "Mountain and the Machine."
// Thin TubeGeometry paths between hold positions with traveling pulse particles.
import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { HOLDS } from "./HoldMarkers";
import type { GamePhase } from "@/hooks/useGamePhase";
import type { QualityLevel } from "@/hooks/useDeviceQuality";

import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

// Shared sphere geometry + scratch objects for pulse InstancedMesh
const PULSE_GEO  = new THREE.SphereGeometry(0.045, 5, 5);
const _pulsePos  = new THREE.Vector3();
const _pulseQuat = new THREE.Quaternion();
const _pulseScale = new THREE.Vector3(1, 1, 1);
const _pulseMat  = new THREE.Matrix4();

const VEIN_PAIRS: [number, number][] = [
  [0, 3], [1, 4], [3, 6], [4, 7],
  [6, 10], [7, 11], [10, 14], [11, 15],
  [14, 17], [15, 18], [2, 5], [5, 9],
];

type VeinPath = { curve: THREE.QuadraticBezierCurve3; length: number };

const AMBER = new THREE.Color("#C8860A");

function buildVeinPaths(): VeinPath[] {
  return VEIN_PAIRS.map(([ai, bi]) => {
    const a = HOLDS[ai];
    const b = HOLDS[bi];
    if (!a || !b) return null;
    const mid = new THREE.Vector3(
      (a.x + b.x) / 2 + (Math.random() - 0.5) * 2,
      (a.y + b.y) / 2,
      a.z - 0.6,  // inside the rock face
    );
    const curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(a.x, a.y, a.z - 0.05),
      mid,
      new THREE.Vector3(b.x, b.y, b.z - 0.05),
    );
    return { curve, length: curve.getLength() };
  }).filter(Boolean) as VeinPath[];
}

type Props = { phase: GamePhase; quality?: QualityLevel };

export const MineralVeins = ({ phase, quality = "high" }: Props) => {
  const pulseRef = useRef<THREE.InstancedMesh>(null!);
  const pulseT   = useRef<number[]>([]);

  const { mergedVeinGeo, paths } = useMemo(() => {
    const paths = buildVeinPaths();
    const tubeGeos = paths.map(p =>
      new THREE.TubeGeometry(p.curve, 18, 0.012, 4, false)
    );
    pulseT.current = paths.map((_, i) => (i / paths.length));
    const mergedVeinGeo = tubeGeos.length > 0 ? mergeGeometries(tubeGeos) : null;
    return { mergedVeinGeo, paths };
  }, []);

  // Stamp initial pulse matrices so spheres appear before first useFrame tick
  useEffect(() => {
    const m = pulseRef.current;
    if (!m || quality !== "high") return;
    paths.forEach((path, i) => {
      path.curve.getPoint(pulseT.current[i], _pulsePos);
      _pulseMat.compose(_pulsePos, _pulseQuat, _pulseScale);
      m.setMatrixAt(i, _pulseMat);
    });
    m.instanceMatrix.needsUpdate = true;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paths]);

  useFrame((_, delta) => {
    // Pulse spheres only on high quality
    if (quality !== "high") return;
    const m = pulseRef.current;
    if (!m) return;
    paths.forEach((path, i) => {
      pulseT.current[i] = (pulseT.current[i] + delta * 0.18) % 1;
      path.curve.getPoint(pulseT.current[i], _pulsePos);
      _pulseMat.compose(_pulsePos, _pulseQuat, _pulseScale);
      m.setMatrixAt(i, _pulseMat);
    });
    m.instanceMatrix.needsUpdate = true;
  });

  if (quality === "low" || phase !== "ascent") return null;

  return (
    <group>
      {/* Static vein lines — 12 unique tube paths merged into 1 draw call */}
      {mergedVeinGeo && (
        <mesh geometry={mergedVeinGeo}>
          <meshBasicMaterial color={AMBER} transparent opacity={0.35} depthWrite={false} />
        </mesh>
      )}

      {/* Traveling pulse spheres — high quality only, 12 meshes → 1 draw call */}
      {quality === "high" && (
        <instancedMesh ref={pulseRef} args={[PULSE_GEO, undefined, paths.length]}>
          <meshBasicMaterial color="#ffa040" />
        </instancedMesh>
      )}
    </group>
  );
};
