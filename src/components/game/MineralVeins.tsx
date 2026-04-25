// src/components/game/MineralVeins.tsx
// Amber circuit veins embedded in the rock face — "Mountain and the Machine."
// Thin TubeGeometry paths between hold positions with traveling pulse particles.
import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { HOLDS } from "./HoldMarkers";
import type { GamePhase } from "@/hooks/useGamePhase";
import type { QualityLevel } from "@/hooks/useDeviceQuality";

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
  const pulseRefs = useRef<(THREE.Mesh | null)[]>([]);
  const pulseT    = useRef<number[]>([]);

  const { tubeGeos, paths } = useMemo(() => {
    const paths = buildVeinPaths();
    const tubeGeos = paths.map(p =>
      new THREE.TubeGeometry(p.curve, 18, 0.012, 4, false)
    );
    pulseT.current = paths.map((_, i) => (i / paths.length));
    return { tubeGeos, paths };
  }, []);

  useFrame((_, delta) => {
    // Pulse spheres only on high quality
    if (quality !== "high") return;
    paths.forEach((_, i) => {
      pulseT.current[i] = (pulseT.current[i] + delta * 0.18) % 1;
      const mesh = pulseRefs.current[i];
      if (!mesh) return;
      paths[i].curve.getPoint(pulseT.current[i], mesh.position);
    });
  });

  if (quality === "low" || phase !== "ascent") return null;

  return (
    <group>
      {/* Static vein lines */}
      {tubeGeos.map((geo, i) => (
        <mesh key={i} geometry={geo}>
          <meshBasicMaterial color={AMBER} transparent opacity={0.35} depthWrite={false} />
        </mesh>
      ))}

      {/* Traveling pulse spheres — high quality only */}
      {quality === "high" && paths.map((_, i) => (
        <mesh
          key={`pulse-${i}`}
          ref={el => { pulseRefs.current[i] = el; }}
          position={[0, 0, 0]}
        >
          <sphereGeometry args={[0.045, 5, 5]} />
          <meshBasicMaterial color="#ffa040" />
        </mesh>
      ))}
    </group>
  );
};
