// src/components/game/GroundTerrain.tsx
import { useMemo } from "react";
import * as THREE from "three";
import type { GamePhase } from "@/hooks/useGamePhase";
import { useMatcaps } from "@/hooks/useMatcaps";
import { useMatcapWithGroundBounce } from "@/hooks/useMatcapWithGroundBounce";

type Props = {
  phase: GamePhase;
};

export const GroundTerrain = ({ phase }: Props) => {
  const matcaps   = useMatcaps();
  const groundMat = useMatcapWithGroundBounce(matcaps.stoneDark);

  const groundGeometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(80, 50, 40, 28);
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

    return Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: (rand() - 0.5) * 70,
      z: (rand() - 0.5) * 44,
      size: 0.15 + rand() * 0.25,
    }));
  }, []);

  const tufts = useMemo(() => {
    let s = 77;
    const rand = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };

    const groups: Array<{ id: number; blades: Array<{ x: number; z: number; rot: number; height: number; lean: number }> }> = [];
    for (let g = 0; g < 15; g++) {
      const groupX = rand() < 0.5 ? -18 - rand() * 17 : 18 + rand() * 17;
      const groupZ = (rand() - 0.5) * 44;
      const bladeCount = 3 + Math.floor(rand() * 3);
      const blades = Array.from({ length: bladeCount }, () => ({
        x:      groupX + (rand() - 0.5) * 0.6,
        z:      groupZ + (rand() - 0.5) * 0.6,
        rot:    rand() * Math.PI,
        height: 0.2 + rand() * 0.25,
        lean:   (rand() - 0.5) * 0.4,
      }));
      groups.push({ id: g, blades });
    }
    return groups;
  }, []);

  if (phase !== "ascent") return null;

  return (
    <group>
      <mesh geometry={groundGeometry} receiveShadow material={groundMat} />

      {rocks.map((rock) => (
        <mesh key={rock.id} position={[rock.x, -0.4, rock.z]} castShadow receiveShadow>
          <sphereGeometry args={[rock.size, 5, 4]} />
          <meshMatcapMaterial matcap={matcaps.stoneDark} />
        </mesh>
      ))}

      {tufts.map((group) =>
        group.blades.map((blade, bi) => (
          <mesh
            key={`${group.id}-${bi}`}
            position={[blade.x, -0.35, blade.z]}
            rotation={[blade.lean, blade.rot, 0]}
          >
            <coneGeometry args={[0.06, blade.height, 4]} />
            <meshMatcapMaterial matcap={matcaps.foliage} />
          </mesh>
        ))
      )}

      <mesh position={[0, -0.1, -0.5]} receiveShadow>
        <boxGeometry args={[12, 0.5, 6]} />
        <meshMatcapMaterial matcap={matcaps.stoneDark} />
      </mesh>
    </group>
  );
};
