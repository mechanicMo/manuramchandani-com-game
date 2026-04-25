// src/components/game/SlalomGates.tsx
// Slalom gate poles along the snowboard descent run.
// Alternating amber/blue flags zigzag across the slope — guides the player's path.
// Uses InstancedMesh for poles + spikes; single useFrame for all flag animations.
import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { GamePhase } from "@/hooks/useGamePhase";
import { useMatcaps } from "@/hooks/useMatcaps";

const SLOPE_Z_START  = -42;
const SLOPE_Y_TOP    = 82;
const SLOPE_Z_RATIO  = 0.65;

const yForZ = (z: number) => Math.max(0, SLOPE_Y_TOP + (z - SLOPE_Z_START) / SLOPE_Z_RATIO);

type Gate = { id: number; x: number; y: number; z: number; color: string };

function makeGates(): Gate[] {
  const gates: Gate[] = [];
  const gateZs = [-48, -54, -60, -66, -72, -78, -84, -90, -96];
  gateZs.forEach((z, i) => {
    const side = i % 2 === 0 ? 1 : -1;
    const xOff = side * (5 + (i % 3) * 1.2);
    const y    = yForZ(z);
    const color = i % 2 === 0 ? "#C8860A" : "#4080ff";
    gates.push({ id: gates.length, x: xOff - 1.4, y, z, color });
    gates.push({ id: gates.length, x: xOff + 1.4, y, z, color });
  });
  return gates;
}

const GATES = makeGates();

// Unit geometries shared across instances
const POLE_GEO  = new THREE.CylinderGeometry(0.028, 0.032, 2.0, 5);
const SPIKE_GEO = new THREE.ConeGeometry(0.035, 0.18, 5);
const FLAG_GEO  = new THREE.BoxGeometry(0.32, 0.22, 0.008);

// Pre-built flag materials keyed by color string — avoids per-frame allocation
const flagMats: Record<string, THREE.MeshBasicMaterial> = {};
function getFlagMat(color: string) {
  if (!flagMats[color]) {
    flagMats[color] = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide });
  }
  return flagMats[color];
}

type Props = { phase: GamePhase };

export const SlalomGates = ({ phase }: Props) => {
  const matcaps  = useMatcaps();
  const poleRef  = useRef<THREE.InstancedMesh>(null!);
  const spikeRef = useRef<THREE.InstancedMesh>(null!);
  const flagRefs = useRef<(THREE.Mesh | null)[]>(Array(GATES.length).fill(null));

  // Stamp pole + spike matrices once — they never move
  useEffect(() => {
    const pole  = poleRef.current;
    const spike = spikeRef.current;
    if (!pole || !spike) return;

    const mat  = new THREE.Matrix4();
    const pos  = new THREE.Vector3();
    const quat = new THREE.Quaternion();
    const sc   = new THREE.Vector3(1, 1, 1);

    GATES.forEach((gate, i) => {
      pos.set(gate.x, gate.y + 1.0, gate.z);
      mat.compose(pos, quat, sc);
      pole.setMatrixAt(i, mat);

      pos.set(gate.x, gate.y - 0.08, gate.z);
      mat.compose(pos, quat, sc);
      spike.setMatrixAt(i, mat);
    });

    pole.instanceMatrix.needsUpdate  = true;
    spike.instanceMatrix.needsUpdate = true;
  }, []);

  // Single useFrame updates all 18 flag rotations
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    for (let i = 0; i < GATES.length; i++) {
      const flag = flagRefs.current[i];
      if (!flag) continue;
      flag.rotation.y = Math.sin(t * 2.8 + i * 0.73) * 0.22;
      flag.rotation.z = Math.sin(t * 2.1 + i * 1.1)  * 0.05;
    }
  });

  if (phase !== "descent") return null;

  return (
    <group>
      {/* Poles — 1 draw call */}
      <instancedMesh ref={poleRef} args={[POLE_GEO, undefined, GATES.length]} castShadow>
        <meshMatcapMaterial matcap={matcaps.metalSoft} />
      </instancedMesh>

      {/* Spikes — 1 draw call */}
      <instancedMesh ref={spikeRef} args={[SPIKE_GEO, undefined, GATES.length]}>
        <meshMatcapMaterial matcap={matcaps.metalSoft} />
      </instancedMesh>

      {/* Flags — individual meshes (two distinct colors, each animated) */}
      {GATES.map((gate, i) => (
        <mesh
          key={gate.id}
          ref={el => { flagRefs.current[i] = el; }}
          geometry={FLAG_GEO}
          material={getFlagMat(gate.color)}
          position={[gate.x, gate.y + 1.85, gate.z]}
        />
      ))}
    </group>
  );
};
