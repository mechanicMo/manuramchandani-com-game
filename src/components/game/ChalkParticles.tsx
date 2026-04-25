// src/components/game/ChalkParticles.tsx
//
// Two particle effects:
//   1. Burst — 20 bright white particles expand outward on hold-grab, then fall.
//      Triggered by incrementing holdGrabTick.
//   2. Drift — 30 faint particles drizzle away from the face while climbing.
//
// Per-particle fade is approximated by dimming color toward background grey
// (PointsMaterial doesn't support per-vertex alpha without a custom shader).
import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const BURST_N = 20;
const DRIFT_N = 30;

type P = {
  active: boolean;
  px: number; py: number; pz: number;
  vx: number; vy: number; vz: number;
  life: number; maxLife: number;
};

type Props = {
  characterPos: THREE.Vector3;
  isClimbing: boolean;
  holdGrabTick: number;
  holdGrabPos: THREE.Vector3 | null;
};

const mkPool = (n: number): P[] =>
  Array.from({ length: n }, () => ({ active: false, px: 0, py: 0, pz: 0, vx: 0, vy: 0, vz: 0, life: 0, maxLife: 1 }));

export const ChalkParticles = ({ characterPos, isClimbing, holdGrabTick, holdGrabPos }: Props) => {
  const burstPtsRef = useRef<THREE.Points>(null);
  const driftPtsRef = useRef<THREE.Points>(null);
  const prevTick    = useRef(holdGrabTick);
  const driftTimer  = useRef(0);

  const burstPool = useRef<P[]>(mkPool(BURST_N));
  const driftPool = useRef<P[]>(mkPool(DRIFT_N));

  const burstPos = useMemo(() => new Float32Array(BURST_N * 3), []);
  const driftPos = useMemo(() => new Float32Array(DRIFT_N * 3), []);
  const burstCol = useMemo(() => new Float32Array(BURST_N * 3).fill(1), []);
  const driftCol = useMemo(() => new Float32Array(DRIFT_N * 3).fill(0.9), []);

  const spawnBurst = (origin: THREE.Vector3) => {
    const pool = burstPool.current;
    for (let i = 0; i < BURST_N; i++) {
      const p = pool[i];
      p.active  = true;
      p.px = origin.x + (Math.random() - 0.5) * 0.3;
      p.py = origin.y + 0.4 + Math.random() * 0.3;
      p.pz = origin.z;
      const θ = Math.random() * Math.PI * 2;
      const r = 0.6 + Math.random() * 1.2;
      p.vx = Math.cos(θ) * r;
      p.vy = 0.2 + Math.random() * 1.0;
      p.vz = (Math.random() - 0.5) * 0.5;
      p.life    = 0;
      p.maxLife = 0.5 + Math.random() * 0.3;
    }
  };

  const spawnDrift = (origin: THREE.Vector3) => {
    const pool = driftPool.current;
    for (let i = 0; i < DRIFT_N; i++) {
      if (!pool[i].active) {
        const p = pool[i];
        p.active  = true;
        p.px = origin.x + (Math.random() - 0.5) * 1.2;
        p.py = origin.y + (Math.random() - 0.5) * 0.6;
        p.pz = origin.z + 0.15 + Math.random() * 0.2;
        p.vx = (Math.random() - 0.5) * 0.3;
        p.vy = -(0.2 + Math.random() * 0.4);
        p.vz = 0.1 + Math.random() * 0.3;
        p.life    = 0;
        p.maxLife = 1.0 + Math.random() * 1.0;
        break;
      }
    }
  };

  useFrame((_s, delta) => {
    // Burst trigger check
    if (holdGrabTick !== prevTick.current && holdGrabPos) {
      spawnBurst(holdGrabPos);
      prevTick.current = holdGrabTick;
    }

    // Drift spawn
    if (isClimbing) {
      driftTimer.current += delta;
      if (driftTimer.current > 0.1) {
        driftTimer.current = 0;
        spawnDrift(characterPos);
      }
    }

    // Update burst particles
    {
      const pool = burstPool.current;
      for (let i = 0; i < BURST_N; i++) {
        const p = pool[i];
        if (!p.active) { burstPos[i * 3 + 1] = -9999; continue; }
        p.life += delta;
        if (p.life >= p.maxLife) { p.active = false; burstPos[i * 3 + 1] = -9999; continue; }
        p.vy -= 4.0 * delta;
        p.px += p.vx * delta;
        p.py += p.vy * delta;
        p.pz += p.vz * delta;
        burstPos[i * 3]     = p.px;
        burstPos[i * 3 + 1] = p.py;
        burstPos[i * 3 + 2] = p.pz;
        // Fade toward grey
        const brightness = 1 - (p.life / p.maxLife) * 0.8;
        burstCol[i * 3]     = brightness;
        burstCol[i * 3 + 1] = brightness;
        burstCol[i * 3 + 2] = brightness;
      }
      if (burstPtsRef.current) {
        burstPtsRef.current.geometry.attributes.position.needsUpdate = true;
        burstPtsRef.current.geometry.attributes.color.needsUpdate = true;
      }
    }

    // Update drift particles
    {
      const pool = driftPool.current;
      for (let i = 0; i < DRIFT_N; i++) {
        const p = pool[i];
        if (!p.active) { driftPos[i * 3 + 1] = -9999; continue; }
        p.life += delta;
        if (p.life >= p.maxLife) { p.active = false; driftPos[i * 3 + 1] = -9999; continue; }
        p.px += p.vx * delta;
        p.py += p.vy * delta;
        p.pz += p.vz * delta;
        driftPos[i * 3]     = p.px;
        driftPos[i * 3 + 1] = p.py;
        driftPos[i * 3 + 2] = p.pz;
        const brightness = 0.7 - (p.life / p.maxLife) * 0.5;
        driftCol[i * 3]     = brightness;
        driftCol[i * 3 + 1] = brightness;
        driftCol[i * 3 + 2] = brightness;
      }
      if (driftPtsRef.current) {
        driftPtsRef.current.geometry.attributes.position.needsUpdate = true;
        driftPtsRef.current.geometry.attributes.color.needsUpdate = true;
      }
    }
  });

  return (
    <>
      <points ref={burstPtsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" array={burstPos} count={BURST_N} itemSize={3} />
          <bufferAttribute attach="attributes-color"    array={burstCol} count={BURST_N} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial size={0.1} vertexColors transparent opacity={0.9} sizeAttenuation depthWrite={false} />
      </points>
      <points ref={driftPtsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" array={driftPos} count={DRIFT_N} itemSize={3} />
          <bufferAttribute attach="attributes-color"    array={driftCol} count={DRIFT_N} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial size={0.06} vertexColors transparent opacity={0.6} sizeAttenuation depthWrite={false} />
      </points>
    </>
  );
};
