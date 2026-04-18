// src/components/game/GroundTerrain.tsx
import { useMemo } from "react";
import * as THREE from "three";
import type { GamePhase } from "@/hooks/useGamePhase";

type Props = {
  phase: GamePhase;
};

type Rock = {
  id: number;
  pos: [number, number, number];
  size: number;
  color: string;
};

function makeRocks(count: number, seed = 42): Rock[] {
  let s = seed;
  const rand = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };

  return Array.from({ length: count }, (_, i) => {
    const h = 0.07 + rand() * 0.06; // hue: brown range
    const l = 0.15 + rand() * 0.08; // lightness: #332820 to #1a1510
    return {
      id: i,
      pos: [
        (rand() - 0.5) * 28,  // x in [-14, 14]
        -0.5 + rand() * 0.2,   // y in [-0.5, -0.3]
        (rand() - 0.5) * 10,   // z in [-5, 5]
      ] as [number, number, number],
      size: 0.1 + rand() * 0.4,
      color: new THREE.Color().setHSL(h, 0.35, l).getHexString(),
    };
  });
}

export const GroundTerrain = ({ phase }: Props) => {
  if (phase !== "ascent") return null;

  // Generate deterministic rocks
  const rocks = useMemo(() => makeRocks(25), []);

  // Create displaced ground plane geometry
  const groundGeometry = useMemo(() => {
    let s = 42; // seed
    const rand = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };

    const geom = new THREE.PlaneGeometry(60, 40, 12, 8);
    geom.rotateX(-Math.PI / 2); // flat on XZ plane

    // Displace vertices with seeded noise
    const pos = geom.attributes.position;
    const originalY = new Float32Array(pos.array);

    for (let i = 0; i < pos.count; i++) {
      const y = originalY[i * 3 + 1];
      const displacement = rand() * 0.4 - 0.2; // range -0.2 to +0.2
      pos.setY(i, y + displacement - 0.5); // shift down to y=-0.5 base
    }
    pos.needsUpdate = true;

    return geom;
  }, []);

  return (
    <group>
      {/* Main ground plane with undulation */}
      <mesh geometry={groundGeometry} position={[0, 0, 0]} receiveShadow>
        <meshStandardMaterial color="#2a2018" roughness={1} metalness={0} />
      </mesh>

      {/* Base rocks */}
      {rocks.map((rock) => (
        <mesh key={rock.id} position={rock.pos} castShadow receiveShadow>
          <cylinderGeometry args={[rock.size, rock.size, 0.15, 32]} />
          <meshStandardMaterial color={`#${rock.color}`} roughness={1} metalness={0} />
        </mesh>
      ))}

      {/* Base camp ledge */}
      <mesh position={[0, -0.3, -1]} receiveShadow castShadow>
        <boxGeometry args={[10, 0.4, 5]} />
        <meshStandardMaterial color="#2a2018" roughness={1} metalness={0} />
      </mesh>
    </group>
  );
};
