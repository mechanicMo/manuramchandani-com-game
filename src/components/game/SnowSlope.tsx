// src/components/game/SnowSlope.tsx
// Snowboard descent slope — visible during summit and descent phases.
// Slope spans from summit edge (y=82, z=-42) down to base (y=0, z≈-96),
// matching the mathematical descent path in Character.tsx.
import { useMemo, useRef, useEffect } from "react";
import * as THREE from "three";
import type { GamePhase } from "@/hooks/useGamePhase";
import { useMatcaps } from "@/hooks/useMatcaps";

// Seeded RNG — deterministic tree placement
function makeRand(seed: number) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

type SnowTreeDef = { id: number; x: number; z: number; height: number; radius: number };

function makeLandingTrees(): SnowTreeDef[] {
  const rand = makeRand(137);
  const trees: SnowTreeDef[] = [];
  for (let i = 0; i < 28; i++) {
    const side = rand() < 0.5 ? -1 : 1;
    const xBase = 19 + rand() * 18;
    const x     = side * xBase;
    const z     = -62 - rand() * 48;
    trees.push({
      id: i, x, z,
      height: 2.2 + rand() * 2.8,
      radius: 0.6 + rand() * 0.8,
    });
  }
  return trees;
}

const LANDING_TREES = makeLandingTrees();

const SLOPE_Z_START  = -42;
const SLOPE_Z_END    = -100;
const SLOPE_Y_TOP    = 82;
const SLOPE_Z_RATIO  = 0.65;
const SLOPE_WIDTH    = 34;

const yForZ = (z: number) =>
  Math.max(0, SLOPE_Y_TOP + (z - SLOPE_Z_START) / SLOPE_Z_RATIO);

// Unit geometries shared across instances
const TRUNK_GEO  = new THREE.CylinderGeometry(0.10, 0.10, 1, 6);
const CONE_GEO   = new THREE.ConeGeometry(0.5, 1, 10, 1);
const SPHERE_GEO = new THREE.SphereGeometry(0.5, 6, 5);

type Props = { phase: GamePhase };

export const SnowSlope = ({ phase }: Props) => {
  const matcaps = useMatcaps();

  const slopeGeometry = useMemo(() => {
    const segsX = 28;
    const segsZ = 44;
    const zLen  = Math.abs(SLOPE_Z_END - SLOPE_Z_START);
    const xStep = SLOPE_WIDTH / segsX;
    const zStep = zLen / segsZ;

    const positions: number[] = [];
    const indices:   number[] = [];

    for (let iz = 0; iz <= segsZ; iz++) {
      for (let ix = 0; ix <= segsX; ix++) {
        const x      = -SLOPE_WIDTH / 2 + ix * xStep;
        const worldZ = SLOPE_Z_START + iz * zStep;
        const baseY  = yForZ(worldZ);
        const undulation =
          Math.sin(x * 0.22 + worldZ * 0.12) * 0.55 +
          Math.sin(x * 0.55 + worldZ * 0.35 + 1.1) * 0.25 +
          Math.sin(worldZ * 0.18) * 0.35;
        positions.push(x, baseY + undulation, worldZ);
      }
    }

    for (let iz = 0; iz < segsZ; iz++) {
      for (let ix = 0; ix < segsX; ix++) {
        const a = iz * (segsX + 1) + ix;
        const b = a + 1;
        const c = a + (segsX + 1);
        const d = c + 1;
        indices.push(a, c, b, b, c, d);
      }
    }

    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    g.setIndex(indices);
    g.computeVertexNormals();
    return g;
  }, []);

  const bermGeometry = useMemo(() => {
    const segsZ = 36;
    const zLen  = Math.abs(SLOPE_Z_END - SLOPE_Z_START);
    const zStep = zLen / segsZ;
    const bermWidth = 4.5;
    const bermHeight = 2.8;
    const segsX = 6;
    const positions: number[] = [];
    const indices:   number[] = [];

    const buildSide = (sideX: number, offset: number) => {
      const vertBase = positions.length / 3;
      for (let iz = 0; iz <= segsZ; iz++) {
        for (let ix = 0; ix <= segsX; ix++) {
          const worldZ    = SLOPE_Z_START + iz * zStep;
          const slopeBaseY = yForZ(worldZ);
          const t         = ix / segsX;
          const bermY     = slopeBaseY + bermHeight * (1 - t * t) * 0.9
                          + Math.sin(worldZ * 0.2 + offset) * 0.4;
          const x         = sideX + (sideX > 0 ? t : -t) * bermWidth;
          positions.push(x, bermY, worldZ);
        }
      }
      for (let iz = 0; iz < segsZ; iz++) {
        for (let ix = 0; ix < segsX; ix++) {
          const a = vertBase + iz * (segsX + 1) + ix;
          const b = a + 1;
          const c = a + (segsX + 1);
          const d = c + 1;
          if (sideX > 0) {
            indices.push(a, b, c, b, d, c);
          } else {
            indices.push(a, c, b, b, c, d);
          }
        }
      }
    };

    buildSide(-SLOPE_WIDTH / 2, 0);
    buildSide( SLOPE_WIDTH / 2, 1.7);

    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    g.setIndex(indices);
    g.computeVertexNormals();
    return g;
  }, []);

  const baseGeometry = useMemo(() => {
    const w = 50;
    const d = 28;
    const segsX = 18;
    const segsZ = 10;
    const centerZ = -92;
    const positions: number[] = [];
    const indices:   number[] = [];

    for (let iz = 0; iz <= segsZ; iz++) {
      for (let ix = 0; ix <= segsX; ix++) {
        const x = -w / 2 + (ix / segsX) * w;
        const z = centerZ - d / 2 + (iz / segsZ) * d;
        const y = Math.sin(x * 0.18) * 0.3 + Math.sin(z * 0.22) * 0.25;
        positions.push(x, y, z);
      }
    }

    for (let iz = 0; iz < segsZ; iz++) {
      for (let ix = 0; ix < segsX; ix++) {
        const a = iz * (segsX + 1) + ix;
        const b = a + 1;
        const c = a + (segsX + 1);
        const d = c + 1;
        indices.push(a, c, b, b, c, d);
      }
    }

    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    g.setIndex(indices);
    g.computeVertexNormals();
    return g;
  }, []);

  // InstancedMesh refs for trees — 7 draw calls total (was 196)
  const trunkRef    = useRef<THREE.InstancedMesh>(null!);
  const cone0Ref    = useRef<THREE.InstancedMesh>(null!);
  const cone1Ref    = useRef<THREE.InstancedMesh>(null!);
  const cone2Ref    = useRef<THREE.InstancedMesh>(null!);
  const cap0Ref     = useRef<THREE.InstancedMesh>(null!);
  const cap1Ref     = useRef<THREE.InstancedMesh>(null!);
  const cap2Ref     = useRef<THREE.InstancedMesh>(null!);

  const treeCount = LANDING_TREES.length;

  useEffect(() => {
    const refs = [trunkRef, cone0Ref, cone1Ref, cone2Ref, cap0Ref, cap1Ref, cap2Ref];
    if (refs.some(r => !r.current)) return;

    const mat   = new THREE.Matrix4();
    const pos   = new THREE.Vector3();
    const scale = new THREE.Vector3();
    const quat  = new THREE.Quaternion();

    LANDING_TREES.forEach((tree, i) => {
      const groundY = tree.z >= SLOPE_Z_END ? yForZ(tree.z) : 0;

      // Trunk: height = tree.height * 0.14, base at groundY + height*0.06
      const trunkH = tree.height * 0.14;
      pos.set(tree.x, groundY + tree.height * 0.06, tree.z);
      scale.set(tree.radius * 0.10 * 2, trunkH, tree.radius * 0.10 * 2);
      mat.compose(pos, quat, scale);
      trunkRef.current.setMatrixAt(i, mat);

      // 3 foliage tiers
      const tiers = [
        { yBase: tree.height * 0.08, r: tree.radius,        h: tree.height * 0.45 },
        { yBase: tree.height * 0.35, r: tree.radius * 0.70, h: tree.height * 0.38 },
        { yBase: tree.height * 0.58, r: tree.radius * 0.44, h: tree.height * 0.30 },
      ];
      const coneRefs = [cone0Ref, cone1Ref, cone2Ref];
      const capRefs  = [cap0Ref, cap1Ref, cap2Ref];

      tiers.forEach((tier, ti) => {
        pos.set(tree.x, groundY + tier.yBase, tree.z);
        scale.set(tier.r * 2, tier.h, tier.r * 2);
        mat.compose(pos, quat, scale);
        coneRefs[ti].current.setMatrixAt(i, mat);

        const capR = tier.r * (0.26 - ti * 0.04);
        pos.set(tree.x, groundY + tier.yBase + tier.h * 0.46, tree.z);
        scale.setScalar(capR * 2);
        mat.compose(pos, quat, scale);
        capRefs[ti].current.setMatrixAt(i, mat);
      });
    });

    refs.forEach(r => { r.current.instanceMatrix.needsUpdate = true; });
  }, []);

  if (phase === "ascent") return null;

  return (
    <group>
      <mesh geometry={slopeGeometry} receiveShadow castShadow>
        <meshMatcapMaterial matcap={matcaps.snow} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={bermGeometry} receiveShadow>
        <meshMatcapMaterial matcap={matcaps.snow} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={baseGeometry} receiveShadow>
        <meshMatcapMaterial matcap={matcaps.snow} />
      </mesh>

      {/* Landing trees — 7 InstancedMesh draw calls (was 196 individual meshes) */}
      <instancedMesh ref={trunkRef} args={[TRUNK_GEO, undefined, treeCount]} castShadow>
        <meshMatcapMaterial matcap={matcaps.wood} />
      </instancedMesh>
      <instancedMesh ref={cone0Ref} args={[CONE_GEO, undefined, treeCount]} castShadow>
        <meshMatcapMaterial matcap={matcaps.foliage} />
      </instancedMesh>
      <instancedMesh ref={cone1Ref} args={[CONE_GEO, undefined, treeCount]} castShadow>
        <meshMatcapMaterial matcap={matcaps.foliage} />
      </instancedMesh>
      <instancedMesh ref={cone2Ref} args={[CONE_GEO, undefined, treeCount]} castShadow>
        <meshMatcapMaterial matcap={matcaps.foliage} />
      </instancedMesh>
      <instancedMesh ref={cap0Ref} args={[SPHERE_GEO, undefined, treeCount]}>
        <meshMatcapMaterial matcap={matcaps.snow} />
      </instancedMesh>
      <instancedMesh ref={cap1Ref} args={[SPHERE_GEO, undefined, treeCount]}>
        <meshMatcapMaterial matcap={matcaps.snow} />
      </instancedMesh>
      <instancedMesh ref={cap2Ref} args={[SPHERE_GEO, undefined, treeCount]}>
        <meshMatcapMaterial matcap={matcaps.snow} />
      </instancedMesh>

      <pointLight
        position={[0, 40, -68]}
        color="#c0d8f0"
        intensity={0.8}
        distance={100}
        decay={1.5}
      />
    </group>
  );
};
