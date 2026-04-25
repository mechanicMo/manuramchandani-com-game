// src/components/game/CloudLayer.tsx
// Wispy cloud band at y=38-50, giving a "breaking through clouds" moment mid-climb.
// InstancedMesh: 18 transparent puffs → 1 draw call.
import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { GamePhase } from "@/hooks/useGamePhase";
import type { QualityLevel } from "@/hooks/useDeviceQuality";

type CloudPuff = {
  id: number;
  x: number;
  y: number;
  z: number;
  rx: number;
  ry: number;
  rz: number;
  sx: number;
  sy: number;
  sz: number;
  driftSpeed: number;
  driftPhase: number;
};

function makePuffs(seed: number): CloudPuff[] {
  let s = seed;
  const rand = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };

  const puffs: CloudPuff[] = [];
  for (let i = 0; i < 18; i++) {
    const angle = rand() * Math.PI * 2;
    const r     = 6 + rand() * 14;
    puffs.push({
      id: i,
      x: Math.cos(angle) * r + (rand() - 0.5) * 8,
      y: 40 + rand() * 10,
      z: -2 + (rand() - 0.5) * 22,
      rx: rand() * 0.4,
      ry: rand() * Math.PI,
      rz: rand() * 0.3,
      sx: 3.5 + rand() * 4.0,
      sy: 0.9 + rand() * 1.2,
      sz: 2.5 + rand() * 3.5,
      driftSpeed: 0.04 + rand() * 0.06,
      driftPhase: rand() * Math.PI * 2,
    });
  }
  return puffs;
}

const ALL_PUFFS = makePuffs(314);

// Unit sphere geometry — scaled per instance via matrix
const PUFF_GEO = new THREE.SphereGeometry(1, 7, 5);

type Props = { phase: GamePhase; quality?: QualityLevel };

export const CloudLayer = ({ phase, quality = "high" }: Props) => {
  const puffCount = quality === "low" ? 0 : quality === "medium" ? 9 : 18;
  const puffs     = useMemo(() => ALL_PUFFS.slice(0, puffCount), [puffCount]);
  const meshRef   = useRef<THREE.InstancedMesh>(null!);
  const dummy     = useMemo(() => { const o = new THREE.Object3D(); o.matrixAutoUpdate = false; return o; }, []);

  // Stamp initial scale+rotation once (only changes position per frame)
  useEffect(() => {
    const m = meshRef.current;
    if (!m) return;
    puffs.forEach((p, i) => {
      dummy.position.set(p.x, p.y, p.z);
      dummy.rotation.set(p.rx, p.ry, p.rz);
      dummy.scale.set(p.sx, p.sy, p.sz);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puffs]);

  // Per-frame: update only position X/Y — bake full matrix each frame since scale and rotation stay constant
  useFrame(({ clock }) => {
    const m = meshRef.current;
    if (!m || puffCount === 0) return;
    const t = clock.elapsedTime;
    puffs.forEach((p, i) => {
      dummy.position.x = p.x + Math.sin(t * p.driftSpeed + p.driftPhase) * 1.2;
      dummy.position.y = p.y + Math.sin(t * p.driftSpeed * 0.7 + p.driftPhase + 1.0) * 0.4;
      dummy.position.z = p.z;
      dummy.rotation.set(p.rx, p.ry, p.rz);
      dummy.scale.set(p.sx, p.sy, p.sz);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  });

  if (puffCount === 0 || phase !== "ascent") return null;

  return (
    <instancedMesh ref={meshRef} args={[PUFF_GEO, undefined, puffCount]}>
      <meshBasicMaterial
        color="#e8eef8"
        transparent
        opacity={0.13}
        depthWrite={false}
        side={THREE.FrontSide}
      />
    </instancedMesh>
  );
};
