// src/components/game/BackgroundMountains.tsx
// Distant mountain silhouettes — authored triangulated ridge profiles, 3 depth layers.
// Close layer: foliage matcap (dark green ridgeline).
// Mid layer: stoneDark matcap (bare rock).
// Far layer: near-black MeshBasicMaterial (pure silhouette, fades with fog).
import { useMemo } from "react";
import * as THREE from "three";
import type { QualityLevel } from "@/hooks/useDeviceQuality";
import { useMatcaps } from "@/hooks/useMatcaps";

type Props = { quality?: QualityLevel };

// Skyline profiles — [xFraction 0-1, yFraction 0-1], left to right
const RIDGE_PROFILES: Array<Array<[number, number]>> = [
  // Ridge A: two main peaks, left dominant
  [[0, 0.1], [0.2, 0.6], [0.35, 0.45], [0.55, 0.9], [0.75, 0.55], [0.9, 0.7], [1, 0.2]],
  // Ridge B: three peaks, central dominant
  [[0, 0.2], [0.15, 0.55], [0.3, 0.4], [0.5, 1.0], [0.65, 0.5], [0.8, 0.7], [1, 0.15]],
  // Ridge C: broad single mass with shoulder
  [[0, 0.3], [0.2, 0.5], [0.45, 0.85], [0.6, 0.75], [0.8, 0.45], [1, 0.2]],
];

function buildRidgeGeometry(profile: Array<[number, number]>): THREE.BufferGeometry {
  const pts: number[] = [];
  const verts: Array<[number, number, number]> = [];

  // Profile points (normalized, scaled at render time via mesh.scale)
  profile.forEach(([fx, fy]) => verts.push([fx - 0.5, fy, 0]));
  // Base corners
  verts.push([0.5, 0, 0]);   // bottom-right
  verts.push([-0.5, 0, 0]);  // bottom-left

  verts.forEach(([x, y, z]) => pts.push(x, y, z));

  const baseL = verts.length - 1;
  const baseR = verts.length - 2;
  const indices: number[] = [];
  for (let i = 0; i < profile.length - 1; i++) {
    indices.push(baseL, i, i + 1);
  }
  indices.push(baseL, profile.length - 1, baseR);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

const LAYER_COUNTS: Record<QualityLevel, number> = { high: 3, medium: 2, low: 1 };

const LAYERS = [
  {
    z: -25, y: -5,
    matcapKey: "foliage" as const,
    ridges: [
      { profileIdx: 0, x: -35, width: 50, height: 36 },
      { profileIdx: 1, x:  10, width: 45, height: 32 },
      { profileIdx: 2, x:  -5, width: 40, height: 28 },
    ],
  },
  {
    z: -45, y: -8,
    matcapKey: "stoneDark" as const,
    ridges: [
      { profileIdx: 1, x: -40, width: 60, height: 55 },
      { profileIdx: 0, x:   5, width: 55, height: 48 },
      { profileIdx: 2, x: -15, width: 50, height: 50 },
    ],
  },
  {
    z: -80, y: -10,
    matcapKey: null,
    color: "#0e0c10",
    ridges: [
      { profileIdx: 2, x: -50, width: 70, height: 75 },
      { profileIdx: 0, x:   0, width: 65, height: 70 },
      { profileIdx: 1, x: -20, width: 60, height: 68 },
    ],
  },
] as const;

export const BackgroundMountains = ({ quality = "high" }: Props) => {
  const matcaps   = useMatcaps();
  const layerCount = LAYER_COUNTS[quality];

  const geometries = useMemo(
    () => RIDGE_PROFILES.map(buildRidgeGeometry),
    []
  );

  return (
    <group>
      {LAYERS.slice(0, layerCount).map((layer, li) =>
        layer.ridges.map((ridge, ri) => (
          <mesh
            key={`${li}-${ri}`}
            geometry={geometries[ridge.profileIdx]}
            position={[ridge.x, layer.y, layer.z]}
            scale={[ridge.width, ridge.height, 1]}
            castShadow={false}
            receiveShadow={false}
          >
            {layer.matcapKey ? (
              <meshMatcapMaterial matcap={matcaps[layer.matcapKey]} fog />
            ) : (
              <meshBasicMaterial color={(layer as { color: string }).color} fog />
            )}
          </mesh>
        ))
      )}
    </group>
  );
};
