// src/components/game/CliffFace.tsx
import { useMemo } from "react";
import * as THREE from "three";

const CLIFF_W = 24;
const CLIFF_H = 120;
const CLIFF_Z = -1.8;

type Chunk = {
  id: number;
  pos: [number, number, number];
  rot: [number, number, number];
  size: number;
  lightness: number;
};

function makeChunks(count: number, seed = 42): Chunk[] {
  let s = seed;
  const rand = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    pos: [(rand() - 0.5) * CLIFF_W * 0.92, rand() * CLIFF_H - 5, CLIFF_Z + 0.5 + rand() * 0.6] as [number, number, number],
    rot: [rand() * Math.PI, rand() * Math.PI, rand() * Math.PI] as [number, number, number],
    size: 0.15 + rand() * 0.55,
    lightness: 0.14 + rand() * 0.18,
  }));
}

export const CliffFace = () => {
  const chunks = useMemo(() => makeChunks(90), []);

  return (
    <group>
      <mesh position={[0, CLIFF_H / 2 - 5, CLIFF_Z]} receiveShadow>
        <boxGeometry args={[CLIFF_W, CLIFF_H, 3]} />
        <meshStandardMaterial color="#3d3028" roughness={1} metalness={0} />
      </mesh>
      {chunks.map(c => {
        const isCoolgrey = c.id % 4 === 0;
        const hue = isCoolgrey ? 0.62 : 0.07;
        const sat = isCoolgrey ? 0.05 : 0.18;
        return (
          <mesh key={c.id} position={c.pos} rotation={c.rot} castShadow receiveShadow>
            <dodecahedronGeometry args={[c.size, 0]} />
            <meshStandardMaterial
              color={new THREE.Color().setHSL(hue, sat, c.lightness)}
              roughness={1}
              metalness={0}
            />
          </mesh>
        );
      })}
      {(() => {
        let s = 42;
        const rand = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
        const boulders: Chunk[] = [];
        for (let i = 0; i < 15; i++) {
          boulders.push({
            id: 1000 + i,
            pos: [(rand() - 0.5) * CLIFF_W * 0.92, rand() * CLIFF_H - 5, CLIFF_Z + 0.2 + rand() * 0.6] as [number, number, number],
            rot: [rand() * Math.PI, rand() * Math.PI, rand() * Math.PI] as [number, number, number],
            size: 0.7 + rand() * 0.7,
            lightness: 0.08 + rand() * 0.06,
          });
        }
        return boulders.map(b => (
          <mesh key={b.id} position={b.pos} rotation={b.rot} castShadow receiveShadow>
            <dodecahedronGeometry args={[b.size, 0]} />
            <meshStandardMaterial
              color={new THREE.Color().setHSL(0.07, 0.18, b.lightness)}
              roughness={1}
              metalness={0}
            />
          </mesh>
        ));
      })()}
    </group>
  );
};
