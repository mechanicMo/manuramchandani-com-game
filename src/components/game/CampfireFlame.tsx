// src/components/game/CampfireFlame.tsx
import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// ── Ember Particles ────────────────────────────────────────────────────────────

const EMBER_COUNT = 20;
const EMBER_LIFETIME = 2.0; // seconds

const EmberParticles = () => {
  const pts = useRef<THREE.Points>(null);

  // x, y, z, birth (encoded as negative age offset)
  const positions = useMemo(() => {
    const arr = new Float32Array(EMBER_COUNT * 3);
    for (let i = 0; i < EMBER_COUNT; i++) {
      arr[i * 3]     = (Math.random() - 0.5) * 0.3;
      arr[i * 3 + 1] = Math.random() * 1.5;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 0.3;
    }
    return arr;
  }, []);

  // Per-ember speed (units/s) and phase offset for horizontal drift
  const speeds = useMemo(
    () => Float32Array.from({ length: EMBER_COUNT }, () => 0.4 + Math.random() * 0.4),
    []
  );
  const phases = useMemo(
    () => Float32Array.from({ length: EMBER_COUNT }, () => Math.random() * Math.PI * 2),
    []
  );

  useFrame(({ clock }) => {
    if (!pts.current) return;
    const t   = clock.getElapsedTime();
    const arr = pts.current.geometry.attributes.position.array as Float32Array;

    for (let i = 0; i < EMBER_COUNT; i++) {
      arr[i * 3 + 1] += speeds[i] * 0.016; // ~60fps tick
      // Horizontal flicker
      arr[i * 3]      = Math.sin(t * 3.0 + phases[i]) * 0.08;

      // Reset when ember rises past tip (~1.5 units)
      if (arr[i * 3 + 1] > 1.5) {
        arr[i * 3]     = (Math.random() - 0.5) * 0.25;
        arr[i * 3 + 1] = 0;
        arr[i * 3 + 2] = (Math.random() - 0.5) * 0.25;
      }
    }
    pts.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pts}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={positions}
          count={EMBER_COUNT}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.028}
        color="#ff9910"
        transparent
        opacity={0.85}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
};

// ── Shader strings ─────────────────────────────────────────────────────────────

const vertexShader = `
  uniform float uTime;
  varying float vY;

  void main() {
    vY = uv.y;
    vec3 pos = position;
    float flicker = sin(uTime * 8.0 + position.y * 4.0) * 0.04
                  + sin(uTime * 13.0 + position.x * 6.0) * 0.03;
    pos.x += flicker * (1.0 - uv.y);
    pos.z += flicker * (1.0 - uv.y);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const fragmentShader = `
  varying float vY;
  uniform float uTime;

  void main() {
    vec3 base  = vec3(0.9, 0.25, 0.02);
    vec3 mid   = vec3(1.0, 0.65, 0.10);
    vec3 tip   = vec3(1.0, 0.95, 0.60);
    vec3 color = mix(base, mid, vY);
    color = mix(color, tip, pow(vY, 2.0));
    float alpha = 1.0 - pow(vY, 1.5);
    gl_FragColor = vec4(color, alpha);
  }
`;

// ── CampfireFlame ──────────────────────────────────────────────────────────────

export const CampfireFlame = () => {
  const lightRef = useRef<THREE.PointLight>(null);

  // Stable uniform object — mutate uTime.value in useFrame
  const uniforms = useMemo(
    () => ({ uTime: { value: 0 } }),
    []
  );

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    uniforms.uTime.value = t;
    if (lightRef.current) {
      lightRef.current.intensity =
        2.8 + Math.sin(t * 7) * 0.3 + Math.sin(t * 13) * 0.2;
    }
  });

  const shaderProps = {
    uniforms,
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  };

  return (
    <group>
      {/* Bottom cone */}
      <mesh position={[0, 0, 0]}>
        <coneGeometry args={[0.3, 0.8, 8, 12]} />
        <shaderMaterial attach="material" {...shaderProps} />
      </mesh>

      {/* Middle cone */}
      <mesh position={[0, 0.4, 0]}>
        <coneGeometry args={[0.18, 0.6, 6, 8]} />
        <shaderMaterial attach="material" {...shaderProps} />
      </mesh>

      {/* Tip cone */}
      <mesh position={[0, 0.7, 0]}>
        <coneGeometry args={[0.08, 0.4, 5, 6]} />
        <shaderMaterial attach="material" {...shaderProps} />
      </mesh>

      {/* Flickering point light */}
      <pointLight
        ref={lightRef}
        position={[0, 0.6, 0]}
        intensity={3}
        color="#ff8820"
        distance={12}
        decay={2}
      />

      {/* Ember particles */}
      <EmberParticles />
    </group>
  );
};
