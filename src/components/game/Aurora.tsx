// src/components/game/Aurora.tsx
// Northern lights curtains — appear when the beacon is lit or on summit arrival.
// 4 independent ribbons, custom vertex+fragment shader, sinusoidal ripple.
import { useState, useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { GamePhase } from "@/hooks/useGamePhase";
import type { QualityLevel } from "@/hooks/useDeviceQuality";

const vertShader = `
  uniform float uTime;
  varying float vY;
  varying float vNorm;

  void main() {
    vY    = uv.y;
    vNorm = uv.x;
    vec3 pos = position;
    float wave  = sin(position.y * 1.8 + uTime * 0.7) * 6.0
                + sin(position.y * 0.9 + uTime * 0.42) * 3.5
                + sin(position.y * 3.5 + uTime * 1.1) * 2.0;
    pos.x += wave;
    pos.z += cos(position.y * 1.2 + uTime * 0.55) * 2.5;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const fragShader = `
  uniform float uTime;
  uniform vec3  uColor1;
  uniform vec3  uColor2;
  varying float vY;
  varying float vNorm;

  void main() {
    // Vertical fade: bright in the middle band, transparent at edges
    float fade = smoothstep(0.0, 0.18, vY) * smoothstep(1.0, 0.82, vY);
    // Horizontal edge fade
    float edge = smoothstep(0.0, 0.08, vNorm) * smoothstep(1.0, 0.92, vNorm);
    // Animated shimmer stripe
    float shimmer = sin(vY * 12.0 - uTime * 2.2) * 0.5 + 0.5;
    vec3  col = mix(uColor1, uColor2, shimmer * 0.6 + 0.2);
    float alpha = fade * edge * (0.18 + shimmer * 0.10);
    gl_FragColor = vec4(col, alpha);
  }
`;

type RibbonDef = {
  posX: number;
  posZ: number;
  width: number;
  height: number;
  rotY: number;
  color1: THREE.Color;
  color2: THREE.Color;
  timeOffset: number;
};

const RIBBONS: RibbonDef[] = [
  { posX: -60, posZ: -200, width: 80, height: 90,  rotY: 0.25,  color1: new THREE.Color("#00f0aa"), color2: new THREE.Color("#00aaff"), timeOffset: 0 },
  { posX:  30, posZ: -220, width: 70, height: 85,  rotY: -0.15, color1: new THREE.Color("#30ffb0"), color2: new THREE.Color("#4060ff"), timeOffset: 1.4 },
  { posX: -20, posZ: -190, width: 55, height: 70,  rotY: 0.05,  color1: new THREE.Color("#00ddcc"), color2: new THREE.Color("#60a0ff"), timeOffset: 2.8 },
  { posX:  80, posZ: -240, width: 90, height: 100, rotY: -0.3,  color1: new THREE.Color("#10ffaa"), color2: new THREE.Color("#0088ff"), timeOffset: 0.7 },
];

type Props = { phase: GamePhase; visible: boolean; quality?: QualityLevel };

export const Aurora = ({ phase, visible, quality = "high" }: Props) => {
  const ribbonCount = quality === "low" ? 0 : quality === "medium" ? 2 : 4;
  const [rendering, setRendering] = useState(false);
  const meshRefs  = useRef<(THREE.Mesh | null)[]>([]);
  const opRef     = useRef(0);

  const activeRibbons = useMemo(() => RIBBONS.slice(0, ribbonCount), [ribbonCount]);

  const uniforms = useMemo(() =>
    activeRibbons.map(r => ({
      uTime:   { value: 0 },
      uColor1: { value: r.color1 },
      uColor2: { value: r.color2 },
    }))
  , [activeRibbons]);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const target = visible && phase === "summit" ? 1 : 0;
    opRef.current += (target - opRef.current) * Math.min(delta * 0.4, 1);

    // Mount when target goes positive, unmount only after fully faded out
    if (target > 0 && !rendering) setRendering(true);
    if (target === 0 && opRef.current < 0.005 && rendering) setRendering(false);

    activeRibbons.forEach((r, i) => {
      uniforms[i].uTime.value = t + r.timeOffset;
      const m = meshRefs.current[i];
      if (m) {
        (m.material as THREE.ShaderMaterial).opacity = opRef.current;
        m.visible = opRef.current > 0.005;
      }
    });
  });

  if (ribbonCount === 0 || !rendering) return null;

  return (
    <group position={[0, 50, 0]}>
      {activeRibbons.map((r, i) => (
        <mesh
          key={i}
          ref={el => { meshRefs.current[i] = el; }}
          position={[r.posX, 0, r.posZ]}
          rotation={[0, r.rotY, 0]}
          visible={false}
        >
          <planeGeometry args={[r.width, r.height, 24, 32]} />
          <shaderMaterial
            attach="material"
            vertexShader={vertShader}
            fragmentShader={fragShader}
            uniforms={uniforms[i]}
            transparent
            opacity={0}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
};
