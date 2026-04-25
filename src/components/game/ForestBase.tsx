// src/components/game/ForestBase.tsx
// Low-poly trees around the mountain base.
// Three clusters: front (Z 50-78 near spawn), left flank (X -18 to -28), right flank (X 18-28).
// Uses InstancedMesh: 3 draw calls total (trunk, foliage, snow) regardless of tree count.
import { useMemo, useRef, useEffect } from "react";
import * as THREE from "three";
import type { GamePhase } from "@/hooks/useGamePhase";
import type { QualityLevel } from "@/hooks/useDeviceQuality";
import { useMatcaps } from "@/hooks/useMatcaps";

type Props = { phase: GamePhase; quality?: QualityLevel };

type TreeDef = {
  id: number;
  x: number;
  z: number;
  height: number;
  radius: number;
};

function makeTrees(count: number, seed = 42): TreeDef[] {
  let s = seed;
  const rand = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };

  return Array.from({ length: count }, (_, i) => {
    const cluster = Math.floor(rand() * 3);
    let x: number, z: number;

    if (cluster === 0) {
      x = (rand() - 0.5) * 50;
      z = 52 + rand() * 26;
    } else if (cluster === 1) {
      x = -18 - rand() * 12;
      z = -10 + rand() * 50;
    } else {
      x = 18 + rand() * 12;
      z = -10 + rand() * 50;
    }

    const height = 2.5 + rand() * 3.0;
    const radius = 0.7 + rand() * 0.9;

    return { id: i, x, z, height, radius };
  });
}

const TREE_COUNTS: Record<QualityLevel, number> = { high: 32, medium: 16, low: 8 };

// Unit geometries shared across all instances
const TRUNK_GEO  = new THREE.CylinderGeometry(0.35, 0.6, 1, 6);   // tapered trunk, height=1
const CONE_GEO   = new THREE.ConeGeometry(0.5, 1, 10);             // foliage tier, r=0.5 height=1
const SPHERE_GEO = new THREE.SphereGeometry(0.5, 6, 5);            // snow cap, r=0.5

// Easter egg — Liz nod. Small amber heart carved on a tree near the path.
const LizHeart = () => (
  <group position={[-7.5, 1.4, 60.5]} rotation={[0, -0.4, 0]} scale={[0.18, 0.18, 0.04]}>
    <mesh position={[-0.6, 0.35, 0]}>
      <sphereGeometry args={[0.7, 12, 12]} />
      <meshBasicMaterial color="#C8860A" />
    </mesh>
    <mesh position={[0.6, 0.35, 0]}>
      <sphereGeometry args={[0.7, 12, 12]} />
      <meshBasicMaterial color="#C8860A" />
    </mesh>
    <mesh position={[0, -0.4, 0]} rotation={[0, 0, Math.PI / 4]}>
      <boxGeometry args={[0.9, 0.9, 0.5]} />
      <meshBasicMaterial color="#C8860A" />
    </mesh>
  </group>
);

export const ForestBase = ({ phase, quality = "high" }: Props) => {
  const trees    = useMemo(() => makeTrees(TREE_COUNTS[quality]), [quality]);
  const matcaps  = useMatcaps();

  const trunkRef   = useRef<THREE.InstancedMesh>(null!);
  const foliageRef = useRef<THREE.InstancedMesh>(null!);
  const snowRef    = useRef<THREE.InstancedMesh>(null!);

  const treeCount = trees.length;
  const tierCount = treeCount * 3; // 3 foliage tiers per tree

  useEffect(() => {
    const trunk   = trunkRef.current;
    const foliage = foliageRef.current;
    const snow    = snowRef.current;
    if (!trunk || !foliage || !snow) return;

    const mat   = new THREE.Matrix4();
    const pos   = new THREE.Vector3();
    const scale = new THREE.Vector3();
    const quat  = new THREE.Quaternion(); // identity

    trees.forEach((tree, ti) => {
      // Trunk: tapered cylinder — scale x/z by radius, y by height
      const trunkH = tree.height * 0.35;
      pos.set(tree.x, tree.height * 0.18, tree.z);
      scale.set(tree.radius, trunkH, tree.radius);
      mat.compose(pos, quat, scale);
      trunk.setMatrixAt(ti, mat);

      // 3 foliage tiers + snow caps per tree
      for (let tier = 0; tier < 3; tier++) {
        const idx    = ti * 3 + tier;
        const coneR  = tree.radius * (1.2 - tier * 0.32);
        const coneH  = tree.height * 0.38;
        const coneY  = tree.height * 0.28 + tier * tree.height * 0.2;

        // Foliage cone: unit cone (r=0.5) scaled to target radius × height
        pos.set(tree.x, coneY, tree.z);
        scale.set(coneR * 2, coneH, coneR * 2);
        mat.compose(pos, quat, scale);
        foliage.setMatrixAt(idx, mat);

        // Snow cap: unit sphere (r=0.5) scaled uniformly to cap radius
        const capR = coneR * 0.22;
        pos.set(tree.x, coneY + tree.height * 0.19, tree.z);
        scale.setScalar(capR * 2);
        mat.compose(pos, quat, scale);
        snow.setMatrixAt(idx, mat);
      }
    });

    trunk.instanceMatrix.needsUpdate   = true;
    foliage.instanceMatrix.needsUpdate = true;
    snow.instanceMatrix.needsUpdate    = true;
  }, [trees]);

  if (phase === "descent") return null;

  return (
    <group>
      <LizHeart />
      <instancedMesh ref={trunkRef} args={[TRUNK_GEO, undefined, treeCount]} castShadow>
        <meshMatcapMaterial matcap={matcaps.wood} />
      </instancedMesh>
      <instancedMesh ref={foliageRef} args={[CONE_GEO, undefined, tierCount]} castShadow receiveShadow>
        <meshMatcapMaterial matcap={matcaps.foliage} />
      </instancedMesh>
      <instancedMesh ref={snowRef} args={[SPHERE_GEO, undefined, tierCount]}>
        <meshMatcapMaterial matcap={matcaps.snow} />
      </instancedMesh>
    </group>
  );
};
