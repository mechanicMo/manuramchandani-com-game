// src/components/game/CloudLayer.tsx
// Wispy cloud band at y=38-50, giving a "breaking through clouds" moment mid-climb.
// During descent the clouds are replaced by the SnowSlope.
import { useRef, useMemo } from "react";
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

type Props = { phase: GamePhase; quality?: QualityLevel };

export const CloudLayer = ({ phase, quality = "high" }: Props) => {
  const puffCount = quality === "low" ? 0 : quality === "medium" ? 9 : 18;
  const groupRef = useRef<THREE.Group>(null);
  const meshRefs = useRef<(THREE.Mesh | null)[]>([]);
  const puffs = useMemo(() => makePuffs(314).slice(0, puffCount), [puffCount]);

  useFrame(s => {
    const t = s.clock.elapsedTime;
    puffs.forEach((p, i) => {
      const m = meshRefs.current[i];
      if (!m) return;
      m.position.x = p.x + Math.sin(t * p.driftSpeed + p.driftPhase) * 1.2;
      m.position.y = p.y + Math.sin(t * p.driftSpeed * 0.7 + p.driftPhase + 1.0) * 0.4;
    });
  });

  if (puffCount === 0 || phase !== "ascent") return null;

  return (
    <group ref={groupRef}>
      {puffs.map((p, i) => (
        <mesh
          key={p.id}
          ref={el => { meshRefs.current[i] = el; }}
          position={[p.x, p.y, p.z]}
          rotation={[p.rx, p.ry, p.rz]}
          scale={[p.sx, p.sy, p.sz]}
        >
          <sphereGeometry args={[1, 7, 5]} />
          <meshBasicMaterial
            color="#e8eef8"
            transparent
            opacity={0.13}
            depthWrite={false}
            side={THREE.FrontSide}
          />
        </mesh>
      ))}
    </group>
  );
};
