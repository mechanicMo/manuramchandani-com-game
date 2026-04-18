// src/components/game/GroundTerrain.tsx
import { useMemo } from "react";
import * as THREE from "three";
import type { GamePhase } from "@/hooks/useGamePhase";

type Props = {
  phase: GamePhase;
};

export const GroundTerrain = ({ phase }: Props) => {
  // All hooks must be called before any conditional returns
  const groundGeometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(80, 50, 20, 14);
    // Rotate to XZ plane so vertices have meaningful x/z coords
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position;

    // Apply vertex colors based on x-zone, then displace Y
    const colors: number[] = [];
    const darkRock  = new THREE.Color("#2a2018");
    const dirt      = new THREE.Color("#3d3025");
    const grass     = new THREE.Color("#2a3018");

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);

      // Displacement noise
      const n = Math.sin(x * 0.3) * Math.cos(z * 0.4) * 0.6
              + Math.sin(x * 0.8 + 1.2) * 0.3;
      pos.setY(i, n - 0.5); // shift down to y=-0.5 base

      // Zone color
      const absX = Math.abs(x);
      let c: THREE.Color;
      if (absX < 6) {
        c = darkRock;
      } else if (absX < 18) {
        c = dirt;
      } else {
        c = grass;
      }
      colors.push(c.r, c.g, c.b);
    }

    g.setAttribute("color", new THREE.BufferAttribute(new Float32Array(colors), 3));
    g.computeVertexNormals();
    return g;
  }, []);

  // Small rocks scattered across ground
  const rocks = useMemo(() => {
    let s = 42;
    const rand = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };

    return Array.from({ length: 40 }, (_, i) => {
      const x = (rand() - 0.5) * 70;
      const z = (rand() - 0.5) * 44;
      const size = 0.15 + rand() * 0.25;
      const hue = 0.06 + rand() * 0.03;
      const l   = 0.15 + rand() * 0.10;
      const color = new THREE.Color().setHSL(hue, 0.3, l);
      return { id: i, x, z, size, color: color.getHexString() };
    });
  }, []);

  // Grass tufts in outer zones
  const tufts = useMemo(() => {
    let s = 77;
    const rand = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };

    const groups: Array<{ id: number; blades: Array<{ x: number; z: number; rot: number }> }> = [];
    for (let g = 0; g < 15; g++) {
      const groupX = rand() < 0.5
        ? -18 - rand() * 17      // left outer zone
        : 18 + rand() * 17;      // right outer zone
      const groupZ = (rand() - 0.5) * 44;
      const bladeCount = 3 + Math.floor(rand() * 3);
      const blades = Array.from({ length: bladeCount }, (_, b) => ({
        x: groupX + (rand() - 0.5) * 0.6,
        z: groupZ + (rand() - 0.5) * 0.6,
        rot: rand() * Math.PI,
      }));
      groups.push({ id: g, blades });
    }
    return groups;
  }, []);

  if (phase !== "ascent") return null;

  return (
    <group>
      {/* Main ground plane with zone vertex colors */}
      <mesh geometry={groundGeometry} receiveShadow>
        <meshStandardMaterial vertexColors roughness={1} metalness={0} />
      </mesh>

      {/* 40 small rocks */}
      {rocks.map((rock) => (
        <mesh
          key={rock.id}
          position={[rock.x, -0.4, rock.z]}
          castShadow
          receiveShadow
        >
          <sphereGeometry args={[rock.size, 5, 4]} />
          <meshStandardMaterial color={`#${rock.color}`} roughness={1} metalness={0} />
        </mesh>
      ))}

      {/* 15 grass tuft groups, 3-5 blades each */}
      {tufts.map((group) =>
        group.blades.map((blade, bi) => (
          <mesh
            key={`${group.id}-${bi}`}
            position={[blade.x, -0.35, blade.z]}
            rotation={[0, blade.rot, 0]}
          >
            <coneGeometry args={[0.06, 0.3, 4]} />
            <meshStandardMaterial color="#2a3018" roughness={1} />
          </mesh>
        ))
      )}

      {/* Base camp ledge */}
      <mesh position={[0, -0.1, -0.5]} receiveShadow castShadow>
        <boxGeometry args={[12, 0.5, 6]} />
        <meshStandardMaterial color="#2a2018" roughness={1} metalness={0} />
      </mesh>
    </group>
  );
};
