// src/components/game/GroundTerrain.tsx
import { useMemo, useRef, useEffect } from "react";
import * as THREE from "three";
import type { GamePhase } from "@/hooks/useGamePhase";
import { useMatcaps } from "@/hooks/useMatcaps";
import { useMatcapWithGroundBounce } from "@/hooks/useMatcapWithGroundBounce";

type Props = {
  phase: GamePhase;
};

// Unit geometries shared across instances
const ROCK_GEO   = new THREE.SphereGeometry(1, 5, 4);
const TUFT_GEO   = new THREE.ConeGeometry(0.06, 1, 4);

export const GroundTerrain = ({ phase }: Props) => {
  const matcaps   = useMatcaps();
  const groundMat = useMatcapWithGroundBounce(matcaps.stoneDark);

  const groundGeometry = useMemo(() => {
    // Extended to z: -22 to +68 (world) so spawn at z=65 has visible terrain
    const g = new THREE.PlaneGeometry(80, 90, 40, 48);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position;

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const n = Math.sin(x * 0.3) * Math.cos(z * 0.4) * 0.6
              + Math.sin(x * 0.8 + 1.2) * 0.3
              + Math.sin(x * 0.15 + z * 0.2) * 0.4;
      pos.setY(i, n - 0.5);
    }

    g.computeVertexNormals();
    return g;
  }, []);

  const rocks = useMemo(() => {
    let s = 42;
    const rand = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };

    return Array.from({ length: 50 }, () => ({
      x: (rand() - 0.5) * 70,
      z: (rand() - 0.5) * 86 + 23, // expanded to match terrain z: -20 to +66
      size: 0.15 + rand() * 0.25,
    }));
  }, []);

  // Flatten grass tufts into individual blade records
  const blades = useMemo(() => {
    let s = 77;
    const rand = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };

    const out: Array<{ x: number; z: number; rot: number; height: number; lean: number }> = [];
    for (let g = 0; g < 18; g++) {
      const groupX = rand() < 0.5 ? -18 - rand() * 17 : 18 + rand() * 17;
      const groupZ = (rand() - 0.5) * 86 + 23;
      const bladeCount = 3 + Math.floor(rand() * 3);
      for (let b = 0; b < bladeCount; b++) {
        out.push({
          x:      groupX + (rand() - 0.5) * 0.6,
          z:      groupZ + (rand() - 0.5) * 0.6,
          rot:    rand() * Math.PI,
          height: 0.2 + rand() * 0.25,
          lean:   (rand() - 0.5) * 0.4,
        });
      }
    }
    return out;
  }, []);

  // Flat stepping stones from spawn (z=62) toward mountain face (z=41) — path guidance
  const pathStones = useMemo(() => {
    return [
      { id: 0, x:  0.0, z: 61, r: 0.72, angle: 0.3 },
      { id: 1, x:  1.2, z: 56, r: 0.60, angle: 1.1 },
      { id: 2, x: -0.8, z: 51, r: 0.68, angle: 2.0 },
      { id: 3, x:  0.6, z: 46, r: 0.55, angle: 0.7 },
      { id: 4, x: -0.3, z: 42, r: 0.63, angle: 1.5 },
    ];
  }, []);

  // InstancedMesh refs
  const rockMeshRef  = useRef<THREE.InstancedMesh>(null!);
  const tuftMeshRef  = useRef<THREE.InstancedMesh>(null!);

  useEffect(() => {
    const rockMesh = rockMeshRef.current;
    if (!rockMesh) return;
    const mat   = new THREE.Matrix4();
    const pos   = new THREE.Vector3();
    const scale = new THREE.Vector3();
    const quat  = new THREE.Quaternion();

    rocks.forEach((rock, i) => {
      pos.set(rock.x, -0.4, rock.z);
      scale.setScalar(rock.size); // unit sphere r=1 → rock.size
      mat.compose(pos, quat, scale);
      rockMesh.setMatrixAt(i, mat);
    });
    rockMesh.instanceMatrix.needsUpdate = true;
  }, [rocks]);

  useEffect(() => {
    const tuftMesh = tuftMeshRef.current;
    if (!tuftMesh) return;
    const mat    = new THREE.Matrix4();
    const pos    = new THREE.Vector3();
    const scale  = new THREE.Vector3();
    const euler  = new THREE.Euler();
    const quat   = new THREE.Quaternion();

    blades.forEach((blade, i) => {
      pos.set(blade.x, -0.35, blade.z);
      euler.set(blade.lean, blade.rot, 0);
      quat.setFromEuler(euler);
      // Unit cone: height=1, so scale Y by blade.height; X/Z unchanged (radius baked into TUFT_GEO)
      scale.set(1, blade.height, 1);
      mat.compose(pos, quat, scale);
      tuftMesh.setMatrixAt(i, mat);
    });
    tuftMesh.instanceMatrix.needsUpdate = true;
  }, [blades]);

  if (phase === "descent") return null;

  return (
    <group>
      {/* Terrain mesh shifted forward so it centers on the play area z: -22 to +68 */}
      <mesh geometry={groundGeometry} receiveShadow material={groundMat} position={[0, 0, 23]} />

      {/* Ground scatter rocks — 1 draw call via InstancedMesh */}
      <instancedMesh ref={rockMeshRef} args={[ROCK_GEO, undefined, rocks.length]} castShadow receiveShadow>
        <meshMatcapMaterial matcap={matcaps.stoneDark} />
      </instancedMesh>

      {/* Grass tufts — 1 draw call via InstancedMesh */}
      <instancedMesh ref={tuftMeshRef} args={[TUFT_GEO, undefined, blades.length]}>
        <meshMatcapMaterial matcap={matcaps.foliage} />
      </instancedMesh>

      {/* Mountain base slab */}
      <mesh position={[0, -0.1, -0.5]} receiveShadow>
        <boxGeometry args={[12, 0.5, 6]} />
        <meshMatcapMaterial matcap={matcaps.stoneDark} />
      </mesh>

      {/* Approach path: flat stone slabs leading from spawn toward the climb face */}
      {pathStones.map(s => (
        <mesh key={s.id} position={[s.x, -0.44, s.z]} rotation={[0, s.angle, 0]} receiveShadow>
          <cylinderGeometry args={[s.r, s.r * 0.88, 0.09, 7]} />
          <meshMatcapMaterial matcap={matcaps.stoneDark} />
        </mesh>
      ))}
    </group>
  );
};
