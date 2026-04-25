// src/components/game/CampfireFlame.tsx
import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// ── Smoke Particles ────────────────────────────────────────────────────────────

const SMOKE_COUNT = 14;
const SMOKE_MAX_LIFE = 2.8;

const SmokeParticles = () => {
  const pts = useRef<THREE.Points>(null);

  const state = useMemo(() => {
    const lifetimes = Float32Array.from({ length: SMOKE_COUNT }, (_, i) => (i / SMOKE_COUNT) * SMOKE_MAX_LIFE);
    const vx = Float32Array.from({ length: SMOKE_COUNT }, () => (Math.random() - 0.5) * 0.28);
    const vz = Float32Array.from({ length: SMOKE_COUNT }, () => (Math.random() - 0.5) * 0.28);
    const speed = Float32Array.from({ length: SMOKE_COUNT }, () => 0.26 + Math.random() * 0.18);
    const positions = new Float32Array(SMOKE_COUNT * 3);
    for (let i = 0; i < SMOKE_COUNT; i++) {
      const lt = lifetimes[i];
      positions[i * 3]     = vx[i] * lt;
      positions[i * 3 + 1] = 1.1 + speed[i] * lt;
      positions[i * 3 + 2] = vz[i] * lt;
    }
    return { lifetimes, vx, vz, speed, positions };
  }, []);

  useFrame((_, delta) => {
    if (!pts.current) return;
    const arr = pts.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < SMOKE_COUNT; i++) {
      state.lifetimes[i] += delta;
      if (state.lifetimes[i] >= SMOKE_MAX_LIFE) {
        state.lifetimes[i] -= SMOKE_MAX_LIFE;
        state.vx[i] = (Math.random() - 0.5) * 0.28;
        state.vz[i] = (Math.random() - 0.5) * 0.28;
        state.speed[i] = 0.26 + Math.random() * 0.18;
        arr[i * 3]     = (Math.random() - 0.5) * 0.18;
        arr[i * 3 + 1] = 1.1;
        arr[i * 3 + 2] = (Math.random() - 0.5) * 0.18;
      } else {
        arr[i * 3]     += state.vx[i] * delta;
        arr[i * 3 + 1] += state.speed[i] * delta;
        arr[i * 3 + 2] += state.vz[i] * delta;
      }
    }
    pts.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pts}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={state.positions} count={SMOKE_COUNT} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.32} color="#9090a4" transparent opacity={0.16} sizeAttenuation depthWrite={false} />
    </points>
  );
};

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

  useFrame(({ clock }, delta) => {
    if (!pts.current) return;
    const t   = clock.getElapsedTime();
    const arr = pts.current.geometry.attributes.position.array as Float32Array;

    for (let i = 0; i < EMBER_COUNT; i++) {
      arr[i * 3 + 1] += speeds[i] * delta;
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

      {/* Rising smoke wisps */}
      <SmokeParticles />
    </group>
  );
};
