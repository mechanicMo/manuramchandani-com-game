import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { RigidBody, CuboidCollider } from "@react-three/rapier";
import * as THREE from "three";
import type { GamePhase } from "@/hooks/useGamePhase";
import type { QualityLevel } from "@/hooks/useDeviceQuality";
import { useMatcaps } from "@/hooks/useMatcaps";

const SUMMIT_Y = 82;

// ── Shared unit geometries ─────────────────────────────────────────────────────
const ICICLE_GEO    = new THREE.ConeGeometry(1, 1, 5, 1);       // unit cone: r=1, h=1
const SNOW_DRIFT_GEO = new THREE.SphereGeometry(1, 6, 4);       // unit sphere: r=1
const EDGE_ROCK_GEO  = new THREE.DodecahedronGeometry(1, 0);    // unit dodecahedron: r=1

// Scratch objects — reused across useEffect calls
const _mat  = new THREE.Matrix4();
const _pos  = new THREE.Vector3();
const _quat = new THREE.Quaternion();
const _scl  = new THREE.Vector3();

// ── Snow drift positions + sizes ───────────────────────────────────────────────
const SNOW_DRIFTS: Array<[number, number, number]> = [
  [-7.5, SUMMIT_Y + 0.08,  -5], [-3, SUMMIT_Y + 0.08, -6], [6, SUMMIT_Y + 0.08, -5.5],
  [-8,   SUMMIT_Y + 0.08,   3], [ 4, SUMMIT_Y + 0.08,  4], [8, SUMMIT_Y + 0.08,  2  ],
  [ 1,   SUMMIT_Y + 0.08,  -2],
];

// ── Edge rock positions + Y offsets ───────────────────────────────────────────
const EDGE_ROCKS: Array<[number, number, number]> = [
  [-10, SUMMIT_Y - 0.2,  -8], [10, SUMMIT_Y - 0.3, -7],
  [-9,  SUMMIT_Y - 0.1,   7], [9,  SUMMIT_Y - 0.2,  6],
  [-5,  SUMMIT_Y - 0.5, -10], [5,  SUMMIT_Y - 0.4, -9],
];

// ── Icicle generator (unchanged from before) ──────────────────────────────────
function makeIcicles(seed: number) {
  let s = seed;
  const rand = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
  const icicles = [];
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

// ── Snow sparkles ──────────────────────────────────────────────────────────────
const SnowSparkle = ({ quality = "high" }: { quality?: QualityLevel }) => {
  const count   = quality === "medium" ? 40 : 80;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy   = useMemo(() => { const o = new THREE.Object3D(); o.matrixAutoUpdate = false; return o; }, []);

  const sparkles = useMemo(() => Array.from({ length: count }, () => ({
    x:   (Math.random() - 0.5) * 19,
    z:   (Math.random() - 0.5) * 15,
    phase: Math.random() * Math.PI * 2,
    freq:  0.7 + Math.random() * 1.3,
    thr:   0.84 + Math.random() * 0.14,
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

// ── Main component ─────────────────────────────────────────────────────────────
export const SummitLedge = ({ phase, quality = "high" }: { phase: GamePhase; quality?: QualityLevel }) => {
  const matcaps = useMatcaps();
  const icicles = useMemo(() => makeIcicles(57), []);

  const icicleRef   = useRef<THREE.InstancedMesh>(null!);
  const driftRef    = useRef<THREE.InstancedMesh>(null!);
  const rockRef     = useRef<THREE.InstancedMesh>(null!);

  // Stamp icicle matrices — pointing downward (rotate π around X)
  useEffect(() => {
    const m = icicleRef.current;
    if (!m) return;
    // Icicles hang down: rotate +π around X so tip points down
    const icicleQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI, 0, 0));
    icicles.forEach((ic, i) => {
      _pos.set(ic.x, SUMMIT_Y - 0.08, ic.z);
      _scl.set(ic.radius, ic.length, ic.radius);
      _mat.compose(_pos, icicleQuat, _scl);
      m.setMatrixAt(i, _mat);
    });
    m.instanceMatrix.needsUpdate = true;
  }, [icicles]);

  // Stamp snow drift matrices — uniform scale, identity rotation
  useEffect(() => {
    const m = driftRef.current;
    if (!m) return;
    SNOW_DRIFTS.forEach(([x, y, z], i) => {
      const r = 0.35 + (i % 3) * 0.14;
      _pos.set(x, y, z);
      _scl.setScalar(r);
      _mat.compose(_pos, _quat, _scl);
      m.setMatrixAt(i, _mat);
    });
    m.instanceMatrix.needsUpdate = true;
  }, []);

  // Stamp edge rock matrices — uniform scale, identity rotation
  useEffect(() => {
    const m = rockRef.current;
    if (!m) return;
    EDGE_ROCKS.forEach(([x, y, z], i) => {
      const r = 0.5 + (i % 3) * 0.2;
      _pos.set(x, y, z);
      _scl.setScalar(r);
      _mat.compose(_pos, _quat, _scl);
      m.setMatrixAt(i, _mat);
    });
    m.instanceMatrix.needsUpdate = true;
  }, []);

  if (phase === "ascent") return null;

  return (
    <group>
      {/* Physical ground for the summit plateau */}
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[11, 1, 9]} position={[0, SUMMIT_Y - 1, 0]} />
      </RigidBody>

      {/* Main plateau */}
      <mesh position={[0, SUMMIT_Y - 1, 0]}>
        <boxGeometry args={[22, 2, 18]} />
        <meshMatcapMaterial matcap={matcaps.stoneLight} />
      </mesh>

      {/* Snow cover on plateau */}
      <mesh position={[0, SUMMIT_Y + 0.06, 0]}>
        <boxGeometry args={[22, 0.14, 18]} />
        <meshMatcapMaterial matcap={matcaps.snow} />
      </mesh>

      {/* Snow drifts — 7 individual meshes → 1 draw call */}
      <instancedMesh ref={driftRef} args={[SNOW_DRIFT_GEO, undefined, SNOW_DRIFTS.length]}>
        <meshMatcapMaterial matcap={matcaps.snow} />
      </instancedMesh>

      {/* Edge rocks — 6 individual meshes → 1 draw call */}
      <instancedMesh ref={rockRef} args={[EDGE_ROCK_GEO, undefined, EDGE_ROCKS.length]} castShadow>
        <meshMatcapMaterial matcap={matcaps.stoneDark} />
      </instancedMesh>

      {/* Icicles — 22 individual meshes → 1 draw call */}
      <instancedMesh ref={icicleRef} args={[ICICLE_GEO, undefined, icicles.length]} castShadow>
        <meshMatcapMaterial matcap={matcaps.snow} />
      </instancedMesh>

      {/* Snow sparkles */}
      {quality !== "low" && <SnowSparkle quality={quality} />}
    </group>
  );
};
