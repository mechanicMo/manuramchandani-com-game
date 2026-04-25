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

const MORNING: SkyParams = {
  fogColor: "#c0ddf4",
  fogDensity: 0.0018,
  sunPosition: [0.6, 0.55, 0.5],
  rayleigh: 3.0,
  turbidity: 4.5,
  ambientIntensity: 0.90,
  ambientColor: "#ddeeff",
};

const MIDDAY: SkyParams = {
  fogColor: "#d8f0ff",
  fogDensity: 0.0012,
  sunPosition: [1, 1.1, 0.2],
  rayleigh: 1.4,
  turbidity: 2.5,
  ambientIntensity: 1.05,
  ambientColor: "#fff8e4",
};

// Dusk — summit at altitude, stars appearing, low sun near horizon
const DUSK: SkyParams = {
  fogColor: "#1a1032",
  fogDensity: 0.0015,
  sunPosition: [0.4, 0.05, 0.9],
  rayleigh: 5.0,
  turbidity: 1.8,
  ambientIntensity: 0.45,
  ambientColor: "#3a2860",
};

// Dawn / cold descent — early morning light, crisp blue-white
const DAWN: SkyParams = {
  fogColor: "#b8d0ec",
  fogDensity: 0.0016,
  sunPosition: [0.5, 0.4, 0.6],
  rayleigh: 3.5,
  turbidity: 4.0,
  ambientIntensity: 0.82,
  ambientColor: "#cce0ff",
};

const _colA = new THREE.Color();
const _colB = new THREE.Color();

function lerpParams(a: SkyParams, b: SkyParams, t: number): SkyParams {
  const lc = (ca: string, cb: string) =>
    "#" + _colA.setStyle(ca).lerp(_colB.setStyle(cb), t).getHexString();
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
  const paramsRef   = useRef<SkyParams>(MORNING);
  const { scene }   = useThree();

  useFrame((_, delta) => {
    // Three-phase sky arc: ascent MORNING→MIDDAY, summit MIDDAY→DUSK, descent DUSK→DAWN→MORNING
    let target: number;
    if (phase === "ascent")  target = 0.0;
    else if (phase === "summit") target = 1.0;
    else target = 0.0; // descent fades back to morning

    progressRef.current = THREE.MathUtils.lerp(progressRef.current, target, delta * 0.25);
    const t = progressRef.current;

    // 0=MORNING, 0..0.5=lerp MORNING→MIDDAY, 0.5..1=lerp MIDDAY→DUSK
    let params: SkyParams;
    if (t < 0.5) {
      params = lerpParams(MORNING, MIDDAY, t * 2);
    } else {
      params = lerpParams(MIDDAY, DUSK, (t - 0.5) * 2);
    }

    // Descent: blend toward DAWN
    if (phase === "descent") {
      const dawnT = THREE.MathUtils.lerp(0, 1, Math.min(1, (1 - progressRef.current) * 2));
      params = lerpParams(params, DAWN, dawnT * 0.5);
    }

    paramsRef.current = params;

    if (scene.fog instanceof THREE.FogExp2) {
      scene.fog.color.setStyle(paramsRef.current.fogColor);
      scene.fog.density = paramsRef.current.fogDensity;
    }
  });

  return paramsRef.current;
};
