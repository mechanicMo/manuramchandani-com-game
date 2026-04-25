import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { RigidBody, CuboidCollider } from "@react-three/rapier";
import * as THREE from "three";
import type { GamePhase } from "@/hooks/useGamePhase";
import type { QualityLevel } from "@/hooks/useDeviceQuality";
import { useMatcaps } from "@/hooks/useMatcaps";

const SUMMIT_Y = 82;

const SnowSparkle = ({ quality = "high" }: { quality?: QualityLevel }) => {
  const count   = quality === "medium" ? 40 : 80;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy   = useMemo(() => new THREE.Object3D(), []);

  const sparkles = useMemo(() => Array.from({ length: count }, () => ({
    x:   (Math.random() - 0.5) * 19,
    z:   (Math.random() - 0.5) * 15,
    phase: Math.random() * Math.PI * 2,
    freq:  0.7 + Math.random() * 1.3,
    thr:   0.84 + Math.random() * 0.14,  // high threshold = rare sparkle
  })), []);

  useFrame(s => {
    if (!meshRef.current) return;
    const t = s.clock.elapsedTime;
    for (let i = 0; i < count; i++) {
      const sp = sparkles[i];
      const v = Math.sin(t * sp.freq + sp.phase);
      const scale = v > sp.thr ? ((v - sp.thr) / (1 - sp.thr)) * 0.06 : 0;
      dummy.position.set(sp.x, SUMMIT_Y + 0.12, sp.z);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 4, 3]} />
      <meshBasicMaterial color="#d8eeff" />
    </instancedMesh>
  );
};

function makeIcicles(seed: number) {
  let s = seed;
  const rand = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
  const icicles = [];
  // Front edge of plateau (z=8..9) and two side clusters
  for (let i = 0; i < 22; i++) {
    const edge = i % 3;
    let x: number, z: number;
    if (edge === 0) { x = -9 + rand() * 18; z = 8.8 + rand() * 0.4; }
    else if (edge === 1) { x = -10.5 + rand() * 0.6; z = -7 + rand() * 14; }
    else { x = 10.0 + rand() * 0.6; z = -7 + rand() * 14; }
    icicles.push({ id: i, x, z, length: 0.18 + rand() * 0.38, radius: 0.025 + rand() * 0.035 });
  }
  return icicles;
}

export const SummitLedge = ({ phase, quality = "high" }: { phase: GamePhase; quality?: QualityLevel }) => {
  const matcaps = useMatcaps();
  const icicles = useMemo(() => makeIcicles(57), []);

  if (phase === "ascent") return null;

  return (
    <group>
      {/* Physical ground for the summit plateau — character walks on this */}
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[11, 1, 9]} position={[0, SUMMIT_Y - 1, 0]} />
      </RigidBody>
      {/* Main plateau — wide stone base the character stands on */}
      <mesh position={[0, SUMMIT_Y - 1, 0]}>
        <boxGeometry args={[22, 2, 18]} />
        <meshMatcapMaterial matcap={matcaps.stoneLight} />
      </mesh>
      {/* Snow cover on plateau */}
      <mesh position={[0, SUMMIT_Y + 0.06, 0]}>
        <boxGeometry args={[22, 0.14, 18]} />
        <meshMatcapMaterial matcap={matcaps.snow} />
      </mesh>
      {/* Irregular snow drifts — lumpy snow surface detail */}
      {[
        [-7.5, 0,  -5], [-3, 0, -6], [6, 0, -5.5],
        [-8,   0,   3], [ 4, 0,  4], [8, 0,  2  ],
        [ 1,   0,  -2],
      ].map(([x, , z], i) => (
        <mesh key={i} position={[x as number, SUMMIT_Y + 0.08, z as number]}>
          <sphereGeometry args={[0.35 + (i % 3) * 0.14, 6, 4]} />
          <meshMatcapMaterial matcap={matcaps.snow} />
        </mesh>
      ))}
      {/* Edge outcrop rocks — give the summit rim an organic feel */}
      {[
        [-10, SUMMIT_Y - 0.2,  -8], [10, SUMMIT_Y - 0.3, -7],
        [-9,  SUMMIT_Y - 0.1,   7], [9,  SUMMIT_Y - 0.2,  6],
        [-5,  SUMMIT_Y - 0.5, -10], [5,  SUMMIT_Y - 0.4, -9],
      ].map(([x, y, z], i) => (
        <mesh key={i} position={[x as number, y as number, z as number]} castShadow>
          <dodecahedronGeometry args={[0.5 + (i % 3) * 0.2, 0]} />
          <meshMatcapMaterial matcap={matcaps.stoneDark} />
        </mesh>
      ))}

      {/* Icicles hanging from ledge edges */}
      {icicles.map(ic => (
        <mesh key={ic.id} position={[ic.x, SUMMIT_Y - 0.08, ic.z]} rotation={[Math.PI, 0, 0]} castShadow>
          <coneGeometry args={[ic.radius, ic.length, 5, 1]} />
          <meshMatcapMaterial matcap={matcaps.snow} />
        </mesh>
      ))}

      {/* Snow sparkle — tiny glinting points on the plateau surface */}
      {quality !== "low" && <SnowSparkle quality={quality} />}
    </group>
  );
};
