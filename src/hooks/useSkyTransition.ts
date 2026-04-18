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

const NIGHT: SkyParams = {
  fogColor: "#0a0d1a",
  fogDensity: 0.022,
  sunPosition: [0, 0.02, -1],
  rayleigh: 8,
  turbidity: 12,
  ambientIntensity: 0.35,
  ambientColor: "#1a2540",
};

const DAY: SkyParams = {
  fogColor: "#c8e8f8",
  fogDensity: 0.012,
  sunPosition: [1, 0.8, 0],
  rayleigh: 2,
  turbidity: 4,
  ambientIntensity: 0.6,
  ambientColor: "#fff4d0",
};

function lerpParams(a: SkyParams, b: SkyParams, t: number): SkyParams {
  const lc = (ca: string, cb: string) =>
    "#" + new THREE.Color(ca).lerp(new THREE.Color(cb), t).getHexString();
  const ln = (a: number, b: number) => a + (b - a) * t;
  const lv = (a: [number,number,number], b: [number,number,number]) =>
    [ln(a[0], b[0]), ln(a[1], b[1]), ln(a[2], b[2])] as [number,number,number];

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
  const paramsRef = useRef<SkyParams>(NIGHT);
  const { scene } = useThree();

  useFrame((_, delta) => {
    const target = phase === "ascent" ? 0 : 1;
    progressRef.current = THREE.MathUtils.lerp(progressRef.current, target, delta * 0.4);
    paramsRef.current = lerpParams(NIGHT, DAY, progressRef.current);

    if (scene.fog instanceof THREE.FogExp2) {
      scene.fog.color.setStyle(paramsRef.current.fogColor);
      scene.fog.density = paramsRef.current.fogDensity;
    }
  });

  return paramsRef.current;
};
