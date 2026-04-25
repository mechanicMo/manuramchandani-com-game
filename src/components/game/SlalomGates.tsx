// src/components/game/SlalomGates.tsx
// Slalom gate poles along the snowboard descent run.
// Alternating amber/blue flags zigzag across the slope — guides the player's path.
// Uses InstancedMesh for poles + spikes + flags: 4 draw calls total (was 20).
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

// Split by color for InstancedMesh batching
const AMBER_FLAGS = GATES.filter(g => g.color === "#C8860A");
const BLUE_FLAGS  = GATES.filter(g => g.color === "#4080ff");

// Unit geometries shared across instances
const POLE_GEO  = new THREE.CylinderGeometry(0.028, 0.032, 2.0, 5);
const SPIKE_GEO = new THREE.ConeGeometry(0.035, 0.18, 5);
const FLAG_GEO  = new THREE.BoxGeometry(0.32, 0.22, 0.008);

// Separate dummy for flags (needs Euler rotation support)
const _flagDummy = new THREE.Object3D();

type Props = { phase: GamePhase };

export const SlalomGates = ({ phase }: Props) => {
  const matcaps       = useMatcaps();
  const poleRef       = useRef<THREE.InstancedMesh>(null!);
  const spikeRef      = useRef<THREE.InstancedMesh>(null!);
  const amberFlagRef  = useRef<THREE.InstancedMesh>(null!);
  const blueFlagRef   = useRef<THREE.InstancedMesh>(null!);

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

  // Single useFrame updates all flag rotations via InstancedMesh matrices
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const af = amberFlagRef.current;
    const bf = blueFlagRef.current;
    if (!af || !bf) return;

    AMBER_FLAGS.forEach((g, j) => {
      _flagDummy.position.set(g.x, g.y + 1.85, g.z);
      _flagDummy.rotation.set(0, Math.sin(t * 2.8 + g.id * 0.73) * 0.22, Math.sin(t * 2.1 + g.id * 1.1) * 0.05);
      _flagDummy.updateMatrix();
      af.setMatrixAt(j, _flagDummy.matrix);
    });
    af.instanceMatrix.needsUpdate = true;

    BLUE_FLAGS.forEach((g, j) => {
      _flagDummy.position.set(g.x, g.y + 1.85, g.z);
      _flagDummy.rotation.set(0, Math.sin(t * 2.8 + g.id * 0.73) * 0.22, Math.sin(t * 2.1 + g.id * 1.1) * 0.05);
      _flagDummy.updateMatrix();
      bf.setMatrixAt(j, _flagDummy.matrix);
    });
    bf.instanceMatrix.needsUpdate = true;
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

      {/* Amber flags — 1 draw call (was 9 individual meshes) */}
      <instancedMesh ref={amberFlagRef} args={[FLAG_GEO, undefined, AMBER_FLAGS.length]}>
        <meshBasicMaterial color="#C8860A" side={THREE.DoubleSide} />
      </instancedMesh>

      {/* Blue flags — 1 draw call (was 9 individual meshes) */}
      <instancedMesh ref={blueFlagRef} args={[FLAG_GEO, undefined, BLUE_FLAGS.length]}>
        <meshBasicMaterial color="#4080ff" side={THREE.DoubleSide} />
      </instancedMesh>
    </group>
  );
};
