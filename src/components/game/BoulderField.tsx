// src/components/game/BoulderField.tsx
// Uses InstancedMesh: 2 draw calls (boulders + snow caps) regardless of boulder count.
import { useMemo, useRef, useEffect } from "react";
import * as THREE from "three";
import type { GamePhase } from "@/hooks/useGamePhase";
import type { QualityLevel } from "@/hooks/useDeviceQuality";
import { useMatcaps } from "@/hooks/useMatcaps";
import { useMatcapWithGroundBounce } from "@/hooks/useMatcapWithGroundBounce";

type Props = {
  phase: GamePhase;
  quality?: QualityLevel;
};

type FlatBoulder = {
  x: number;
  y: number;
  z: number;
  radius: number;
};

function makeBoulders(clusterCount: number, seed = 456): FlatBoulder[] {
  let s = seed;
  const rand = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };

  const out: FlatBoulder[] = [];

  for (let i = 0; i < clusterCount; i++) {
    const cluster = Math.floor(rand() * 3);
    let cx: number, cz: number;

    if (cluster === 0) {
      cx = (rand() - 0.5) * 38;
      cz = 55 + rand() * 18;
    } else if (cluster === 1) {
      cx = -(14 + rand() * 8);
      cz = 15 + rand() * 38;
    } else {
      cx = 14 + rand() * 8;
      cz = 15 + rand() * 38;
    }

    const boulderCount = 3 + Math.floor(rand() * 3);
    for (let j = 0; j < boulderCount; j++) {
      const radius  = 0.5 + rand() * 1.2;
      const offsetY = -(radius * 0.35) + (rand() - 0.5) * 0.4;
      out.push({
        x: cx + (rand() - 0.5) * 2.2,
        y: offsetY,
        z: cz + (rand() - 0.5) * 1.8,
        radius,
      });
    }
  }

  return out;
}

const BOULDER_COUNTS: Record<QualityLevel, number> = { high: 16, medium: 10, low: 5 };

// Unit geometries (shared)
const DODECA_GEO   = new THREE.DodecahedronGeometry(1, 0);
const SNOWCAP_GEO  = new THREE.SphereGeometry(0.55, 6, 4, 0, Math.PI * 2, 0, Math.PI * 0.45);

export const BoulderField = ({ phase, quality = "high" }: Props) => {
  const boulders   = useMemo(() => makeBoulders(BOULDER_COUNTS[quality]), [quality]);
  const matcaps    = useMatcaps();
  const boulderMat = useMatcapWithGroundBounce(matcaps.stoneDark);

  const bodyRef    = useRef<THREE.InstancedMesh>(null!);
  const capRef     = useRef<THREE.InstancedMesh>(null!);

  const count = boulders.length;

  useEffect(() => {
    const body = bodyRef.current;
    const cap  = capRef.current;
    if (!body || !cap) return;

    const mat   = new THREE.Matrix4();
    const pos   = new THREE.Vector3();
    const scale = new THREE.Vector3();
    const quat  = new THREE.Quaternion();

    boulders.forEach((b, i) => {
      // Boulder body: unit dodecahedron (r=1), scale uniformly by radius
      pos.set(b.x, b.y, b.z);
      scale.setScalar(b.radius);
      mat.compose(pos, quat, scale);
      body.setMatrixAt(i, mat);

      // Snow cap: positioned on top of boulder
      pos.set(b.x, b.y + b.radius * 0.7, b.z);
      scale.setScalar(b.radius);
      mat.compose(pos, quat, scale);
      cap.setMatrixAt(i, mat);
    });

    body.instanceMatrix.needsUpdate = true;
    cap.instanceMatrix.needsUpdate  = true;
  }, [boulders]);

  if (phase === "descent") return null;

  return (
    <group>
      <instancedMesh ref={bodyRef} args={[DODECA_GEO, undefined, count]} material={boulderMat} castShadow receiveShadow />
      <instancedMesh ref={capRef} args={[SNOWCAP_GEO, undefined, count]}>
        <meshMatcapMaterial matcap={matcaps.snow} />
      </instancedMesh>
    </group>
  );
};
