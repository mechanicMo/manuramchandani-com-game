// src/components/game/BackgroundMountains.tsx
// Distant mountain silhouettes rendered as flat-shaded low-poly shapes.
// Three layers at increasing distances; foremost layer is most detailed.
// Quality tier gates the layer count.
import { useMemo } from "react";
import * as THREE from "three";
import type { QualityLevel } from "@/hooks/useDeviceQuality";

type Props = { quality?: QualityLevel };

type PeakDef = {
  x: number;
  z: number;
  height: number;
  width: number;
  color: string;
};

function makePeaks(seed: number, count: number, z: number, zSpread: number, hMin: number, hMax: number, xSpread: number): PeakDef[] {
  let s = seed;
  const rand = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };

  return Array.from({ length: count }, () => ({
    x:      (rand() - 0.5) * xSpread,
    z:      z - rand() * zSpread,
    height: hMin + rand() * (hMax - hMin),
    width:  20 + rand() * 30,
    color:  `hsl(${210 + rand() * 20}, ${8 + rand() * 6}%, ${26 + rand() * 14}%)`,
  }));
}

// Build a simple jagged ridge geometry from a peak definition
function buildPeakGeometry(peak: PeakDef): THREE.BufferGeometry {
  const { height, width } = peak;
  // 5-point silhouette: base-left, shoulder-left, apex, shoulder-right, base-right
  const sx = width * 0.5;
  const mid = (Math.random() - 0.5) * width * 0.1; // slight horizontal apex shift

  const verts: number[] = [
    -sx,        0,       0,
    -sx * 0.55, height * 0.6 + Math.random() * height * 0.1, 0,
    mid,        height,  0,
    sx * 0.55,  height * 0.6 + Math.random() * height * 0.1, 0,
    sx,         0,       0,
  ];

  // Fan triangulate from apex (index 2)
  const indices: number[] = [
    0, 1, 2,
    0, 2, 4,
    2, 3, 4,
  ];

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

const LAYER_COUNTS: Record<QualityLevel, number> = { high: 3, medium: 2, low: 1 };

const LAYER_CONFIGS = [
  // Layer 1 — nearest, most detailed
  { seed: 111, count: 12, z: -120, zSpread: 20, hMin: 28, hMax: 52, xSpread: 320 },
  // Layer 2 — mid
  { seed: 222, count: 10, z: -180, zSpread: 25, hMin: 38, hMax: 70, xSpread: 380 },
  // Layer 3 — furthest, large massifs
  { seed: 333, count:  8, z: -250, zSpread: 30, hMin: 55, hMax: 95, xSpread: 440 },
];

export const BackgroundMountains = ({ quality = "high" }: Props) => {
  const layerCount = LAYER_COUNTS[quality];

  const layers = useMemo(() =>
    LAYER_CONFIGS.slice(0, layerCount).map(cfg =>
      makePeaks(cfg.seed, cfg.count, cfg.z, cfg.zSpread, cfg.hMin, cfg.hMax, cfg.xSpread)
    ),
  [layerCount]);

  return (
    <group>
      {layers.map((peaks, li) =>
        peaks.map((peak, pi) => {
          const geo = buildPeakGeometry(peak);
          return (
            <mesh
              key={`${li}-${pi}`}
              geometry={geo}
              position={[peak.x, 0, peak.z]}
              receiveShadow={false}
              castShadow={false}
            >
              <meshStandardMaterial
                color={peak.color}
                roughness={1}
                metalness={0}
                side={THREE.FrontSide}
                depthWrite
              />
            </mesh>
          );
        })
      )}
    </group>
  );
};
