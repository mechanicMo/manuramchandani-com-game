// src/components/game/LandingFlare.tsx
// Celebratory snow burst + golden light that fires when the player arrives
// at the newsletter kiosk landing zone (z≈-83, y≈2) at the end of the descent.
import { useRef, useMemo, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { GamePhase } from "@/hooks/useGamePhase";
import type { QualityLevel } from "@/hooks/useDeviceQuality";

const KIOSK_POS: [number, number, number] = [0, 2, -83];
const TRIGGER_RADIUS = 12;
const BURST_COUNTS: Record<QualityLevel, number> = { high: 60, medium: 40, low: 20 };

type P = { active: boolean; px: number; py: number; pz: number; vx: number; vy: number; vz: number; life: number; maxLife: number };

const mkPool = (size: number): P[] => Array.from({ length: size }, () => ({
  active: false, px: 0, py: 0, pz: 0, vx: 0, vy: 0, vz: 0, life: 0, maxLife: 1.2,
}));

type Props = { phase: GamePhase; characterPos: THREE.Vector3; quality?: QualityLevel };

export const LandingFlare = ({ phase, characterPos, quality = "high" }: Props) => {
  const burstCount = BURST_COUNTS[quality];
  const ptsRef   = useRef<THREE.Points>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const pool     = useRef<P[]>(mkPool(burstCount));
  const fired    = useRef(false);
  const [active, setActive] = useState(false);

  const positions = useMemo(() => new Float32Array(burstCount * 3), [burstCount]);
  const colors    = useMemo(() => new Float32Array(burstCount * 3).fill(1), [burstCount]);

  // Reset on every new descent so the celebration fires again
  useEffect(() => {
    if (phase !== "descent") {
      fired.current = false;
      setActive(false);
    }
  }, [phase]);

  useFrame((_, delta) => {
    if (phase !== "descent") return;

    const dx = characterPos.x - KIOSK_POS[0];
    const dz = characterPos.z - KIOSK_POS[2];
    const dist2D = Math.sqrt(dx * dx + dz * dz);

    // Fire burst on first arrival
    if (!fired.current && dist2D < TRIGGER_RADIUS) {
      fired.current = true;
      setActive(true);
      pool.current = mkPool(burstCount);
      for (let i = 0; i < burstCount; i++) {
        const p = pool.current[i];
        const angle = (i / burstCount) * Math.PI * 2 + Math.random() * 0.3;
        const speed = 1.5 + Math.random() * 2.5;
        p.active  = true;
        p.px = KIOSK_POS[0] + (Math.random() - 0.5) * 2;
        p.py = KIOSK_POS[1] + 0.5;
        p.pz = KIOSK_POS[2] + (Math.random() - 0.5) * 2;
        p.vx = Math.cos(angle) * speed;
        p.vy = 2.0 + Math.random() * 3.0;
        p.vz = Math.sin(angle) * speed;
        p.life    = 0;
        p.maxLife = 0.8 + Math.random() * 0.6;
      }
    }

    if (!active) return;

    let anyActive = false;
    for (let i = 0; i < burstCount; i++) {
      const p = pool.current[i];
      if (!p.active) { positions[i * 3 + 1] = -9999; continue; }
      p.life += delta;
      if (p.life >= p.maxLife) { p.active = false; positions[i * 3 + 1] = -9999; continue; }
      anyActive = true;
      p.vy -= 4 * delta;
      p.px += p.vx * delta;
      p.py += p.vy * delta;
      p.pz += p.vz * delta;
      positions[i * 3]     = p.px;
      positions[i * 3 + 1] = p.py;
      positions[i * 3 + 2] = p.pz;
      const t = 1 - p.life / p.maxLife;
      const g = 0.7 + t * 0.3;
      colors[i * 3]     = 1.0;
      colors[i * 3 + 1] = g;
      colors[i * 3 + 2] = 0.3;
    }

    if (ptsRef.current) {
      ptsRef.current.geometry.attributes.position.needsUpdate = true;
      ptsRef.current.geometry.attributes.color.needsUpdate    = true;
    }

    // Flickering golden light that fades in then out
    if (lightRef.current) {
      const minLife = Math.min(...pool.current.filter(p => p.active).map(p => p.life / p.maxLife), 1);
      lightRef.current.intensity = (1 - minLife) * 4.5;
    }

    if (!anyActive) setActive(false);
  });

  if (phase !== "descent" || !active) return null;

  return (
    <>
      <points ref={ptsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" array={positions} count={burstCount} itemSize={3} />
          <bufferAttribute attach="attributes-color"    array={colors}    count={burstCount} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial size={0.12} vertexColors transparent opacity={0.9} sizeAttenuation depthWrite={false} />
      </points>
      <pointLight ref={lightRef} position={KIOSK_POS} color="#ffb040" intensity={0} distance={25} decay={2} />
    </>
  );
};
