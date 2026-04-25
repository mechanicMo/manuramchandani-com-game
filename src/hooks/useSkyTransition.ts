import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { GamePhase } from "@/hooks/useGamePhase";

export type SkyParams = {
  fogColor: string;
  fogDensity: number;
  sunPosition: [number, number, number];
  rayleigh: number;
  turbidity: number;
  ambientIntensity: number;
  ambientColor: string;
};

// Spec: always bright daytime, +25% baseline brightness vs old visual spec's night arc.
// MORNING → MIDDAY transition as player climbs and summits.

const MORNING: SkyParams = {
  fogColor: "#b8d8f0",
  fogDensity: 0.010,
  sunPosition: [0.6, 0.55, 0.5],
  rayleigh: 3.5,
  turbidity: 5.5,
  ambientIntensity: 0.75,
  ambientColor: "#ddeeff",
};

const MIDDAY: SkyParams = {
  fogColor: "#d4ecf8",
  fogDensity: 0.007,
  sunPosition: [1, 1.1, 0.2],
  rayleigh: 1.8,
  turbidity: 3,
  ambientIntensity: 0.92,
  ambientColor: "#fff8e4",
};

function lerpParams(a: SkyParams, b: SkyParams, t: number): SkyParams {
  const lc = (ca: string, cb: string) =>
    "#" + new THREE.Color(ca).lerp(new THREE.Color(cb), t).getHexString();
  const ln = (x: number, y: number) => x + (y - x) * t;
  const lv = (x: [number,number,number], y: [number,number,number]) =>
    [ln(x[0], y[0]), ln(x[1], y[1]), ln(x[2], y[2])] as [number,number,number];

  return {
    fogColor:         lc(a.fogColor, b.fogColor),
    fogDensity:       ln(a.fogDensity, b.fogDensity),
    sunPosition:      lv(a.sunPosition, b.sunPosition),
    rayleigh:         ln(a.rayleigh, b.rayleigh),
    turbidity:        ln(a.turbidity, b.turbidity),
    ambientIntensity: ln(a.ambientIntensity, b.ambientIntensity),
    ambientColor:     lc(a.ambientColor, b.ambientColor),
  };
}

export const useSkyTransition = (phase: GamePhase): SkyParams => {
  const progressRef = useRef(0);
  const paramsRef = useRef<SkyParams>(MORNING);
  const { scene } = useThree();

  useFrame((_, delta) => {
    const target = phase === "ascent" ? 0 : 1;
    progressRef.current = THREE.MathUtils.lerp(progressRef.current, target, delta * 0.3);
    paramsRef.current = lerpParams(MORNING, MIDDAY, progressRef.current);

    if (scene.fog instanceof THREE.FogExp2) {
      scene.fog.color.setStyle(paramsRef.current.fogColor);
      scene.fog.density = paramsRef.current.fogDensity;
    }
  });

  return paramsRef.current;
};
