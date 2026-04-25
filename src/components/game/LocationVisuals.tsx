// src/components/game/LocationVisuals.tsx
import { useRef, useMemo, memo, Suspense } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useMemo as useMemoR } from "react";
import { LOCATIONS } from "@/data/locations";
import type { GamePhase } from "@/hooks/useGamePhase";
import { CampfireFlame } from "./CampfireFlame";
import { ScreenMesh } from "./ScreenMesh";

type Props = { phase: GamePhase };

export const LocationVisuals = ({ phase }: Props) => {
  const locations = useMemo(
    () => LOCATIONS.filter(loc => loc.phase === phase),
    [phase]
  );

  return (
    <>
      {locations.map(loc => (
        <LocationVisual key={loc.id} x={loc.x} y={loc.y} z={loc.z} visualType={loc.visualType} />
      ))}
    </>
  );
};

// ── Terminal canvas texture for Agent Cave ─────────────────────────────────────

function makeTerminalTexture(): THREE.CanvasTexture {
  const canvas  = document.createElement("canvas");
  canvas.width  = 256;
  canvas.height = 192;
  const ctx     = canvas.getContext("2d")!;
  ctx.fillStyle = "#001a00";
  ctx.fillRect(0, 0, 256, 192);
  ctx.fillStyle = "#00cc44";
  ctx.font      = "bold 14px monospace";
  const lines   = [
    "> sleeping-employees",
    "> scanning jobs...",
    "> 12 matches found",
    "> generating proposals...",
    "> proposal_47.md ✓",
    "> proposal_48.md ✓",
    "_",
  ];
  lines.forEach((line, i) => ctx.fillText(line, 8, 24 + i * 24));
  return new THREE.CanvasTexture(canvas);
}

// ── IssueGateVisual: proximity flash ──────────────────────────────────────────

const IssueGateVisual = ({ x, y, z }: { x: number; y: number; z: number }) => {
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame(({ clock }) => {
    if (!lightRef.current) return;
    const t         = clock.getElapsedTime();
    const phase     = (t % 1.0);
    const triangle  = phase < 0.5 ? phase * 2 : (1 - phase) * 2;
    lightRef.current.intensity = triangle * 3;
  });

  return (
    <group position={[x, y, z]}>
      {/* Left pole */}
      <mesh position={[-1.5, 0, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 4, 6]} />
        <meshStandardMaterial color="#ff6020" emissive="#ff4010" emissiveIntensity={0.6} />
      </mesh>
      {/* Right pole */}
      <mesh position={[1.5, 0, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 4, 6]} />
        <meshStandardMaterial color="#ff6020" emissive="#ff4010" emissiveIntensity={0.6} />
      </mesh>
      {/* Horizontal crossbar */}
      <mesh position={[0, 2, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.04, 0.04, 3, 6]} />
        <meshStandardMaterial color="#ff6020" emissive="#ff4010" emissiveIntensity={0.5} />
      </mesh>
      {/* Flag */}
      <mesh position={[0, 1.5, 0]}>
        <planeGeometry args={[2.8, 0.5]} />
        <meshStandardMaterial
          color="#ff8020"
          transparent
          opacity={0.7}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Flashing amber light */}
      <pointLight
        ref={lightRef}
        position={[0, 2, 0]}
        color="#ff8020"
        intensity={0}
        distance={10}
        decay={2}
      />
    </group>
  );
};

// ── Per-location renderers ─────────────────────────────────────────────────────

const BaseCamp = ({ x, y, z }: { x: number; y: number; z: number }) => (
  <group position={[x, y, z]}>
    {/* Campfire flame shader */}
    <CampfireFlame />

    {/* Campfire log ring */}
    <mesh position={[0, -0.15, 0]} rotation={[0, 0.5, 0]}>
      <cylinderGeometry args={[0.4, 0.5, 0.12, 6]} />
      <meshStandardMaterial color="#5a3010" roughness={1} />
    </mesh>

    {/* Tent: two triangular panels */}
    <mesh position={[1.4, 0.5, -0.3]} rotation={[0, 0.4, 0]}>
      <coneGeometry args={[0.7, 1.2, 3, 1]} />
      <meshStandardMaterial color="#2a4030" roughness={0.9} side={THREE.DoubleSide} />
    </mesh>
    <mesh position={[1.4, 0.5, 0.3]} rotation={[0, -0.4, 0]}>
      <coneGeometry args={[0.5, 1.0, 3, 1]} />
      <meshStandardMaterial color="#2a4030" roughness={0.9} side={THREE.DoubleSide} />
    </mesh>

    {/* Rope coil */}
    <mesh position={[-1.2, 0.05, 0.4]} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[0.28, 0.05, 6, 16]} />
      <meshStandardMaterial color="#8a7040" roughness={0.9} />
    </mesh>

    {/* Chalk bag */}
    <mesh position={[-0.6, 0.12, 0.5]}>
      <cylinderGeometry args={[0.1, 0.09, 0.25, 8]} />
      <meshStandardMaterial color="#e8e0d0" roughness={0.8} />
    </mesh>
  </group>
);

const PrismLedge = ({ x, y, z }: { x: number; y: number; z: number }) => (
  <group position={[x, y, z]}>
    {/* Laptop base */}
    <mesh>
      <boxGeometry args={[0.7, 0.05, 0.5]} />
      <meshStandardMaterial color="#2a2a2a" metalness={0.7} roughness={0.3} />
    </mesh>
    {/* Screen panel, angled ~110deg from base (open ~70deg from vertical) */}
    <group position={[0, 0.025, -0.23]} rotation={[-(Math.PI * 110) / 180, 0, 0]}>
      <mesh>
        <boxGeometry args={[0.7, 0.45, 0.03]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.5} roughness={0.4} />
      </mesh>
      {/* Screen surface */}
      <group position={[0, 0, 0.016]}>
        <Suspense fallback={null}>
          <ScreenMesh
            imagePath="/screenshots/prism.png"
            width={0.65}
            height={0.42}
            glowColor="#b0d8ff"
          />
        </Suspense>
      </group>
    </group>
  </group>
);

const AgentCave = ({ x, y, z }: { x: number; y: number; z: number }) => {
  const termTex = useMemo(() => makeTerminalTexture(), []);

  return (
    <group position={[x, y, z]}>
      {/* Mac Mini body */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.32, 0.04, 0.32]} />
        <meshStandardMaterial color="#9a9a9a" metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Small monitor */}
      <group position={[0.5, 0.3, -0.1]} rotation={[0, -0.2, 0]}>
        <mesh>
          <boxGeometry args={[0.22, 0.16, 0.02]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.4} />
        </mesh>
        {/* Terminal screen */}
        <mesh position={[0, 0, 0.011]}>
          <planeGeometry args={[0.2, 0.14]} />
          <meshStandardMaterial
            map={termTex}
            emissive="#00cc44"
            emissiveMap={termTex}
            emissiveIntensity={0.8}
            roughness={0.1}
          />
        </mesh>
        <pointLight position={[0, 0, 0.2]} color="#00cc44" intensity={1} distance={4} decay={2} />
      </group>
      {/* Stacked papers */}
      {[0, 1, 2].map(i => (
        <mesh key={i} position={[-0.5, 0.02 + i * 0.013, 0.1 + i * 0.005]}>
          <boxGeometry args={[0.26, 0.01, 0.2]} />
          <meshStandardMaterial color="#f0ead8" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
};

const LeagueLadsCrag = ({ x, y, z }: { x: number; y: number; z: number }) => (
  <group position={[x, y, z]}>
    {/* 3 champion silhouettes using CapsuleGeometry */}
    {([-0.7, 0, 0.7] as number[]).map((x, i) => (
      <group key={i} position={[x, 0.6 + i * 0.1, 0]}>
        {/* Body capsule */}
        <mesh>
          <capsuleGeometry args={[0.14, 0.6 + i * 0.05, 4, 8]} />
          <meshStandardMaterial color="#8a6a10" emissive="#6a4a00" emissiveIntensity={0.3} roughness={0.6} />
        </mesh>
        {/* Head sphere */}
        <mesh position={[0, 0.55 + i * 0.025, 0]}>
          <sphereGeometry args={[0.12, 8, 6]} />
          <meshStandardMaterial color="#8a6a10" emissive="#6a4a00" emissiveIntensity={0.3} roughness={0.6} />
        </mesh>
      </group>
    ))}
    <pointLight position={[0, 1.5, 0.5]} color="#c8960a" intensity={1.2} distance={6} decay={2} />
  </group>
);

const BJJLedge = ({ x, y, z }: { x: number; y: number; z: number }) => (
  <group position={[x, y, z]}>
    {/* Gi jacket — two flat panels */}
    <mesh position={[-0.15, 0.3, 0]} rotation={[0, 0, 0.1]}>
      <boxGeometry args={[0.5, 1.1, 0.05]} />
      <meshStandardMaterial color="#e8e8e0" roughness={0.9} />
    </mesh>
    <mesh position={[0.15, 0.2, 0.02]} rotation={[0, 0, -0.1]}>
      <boxGeometry args={[0.45, 1.0, 0.04]} />
      <meshStandardMaterial color="#e0e0d8" roughness={0.9} />
    </mesh>
    {/* Belt */}
    <mesh position={[0, -0.2, 0.04]}>
      <boxGeometry args={[0.55, 0.06, 0.02]} />
      <meshStandardMaterial color="#1a1a1a" roughness={0.8} />
    </mesh>
    {/* Piton */}
    <mesh position={[0.9, 0.4, 0.05]} rotation={[0, 0, 0.3]}>
      <cylinderGeometry args={[0.02, 0.02, 0.35, 6]} />
      <meshStandardMaterial color="#706050" metalness={0.5} roughness={0.6} />
    </mesh>
    {/* Chalk bag — teardrop: sphere + cylinder */}
    <group position={[-0.9, -0.1, 0]}>
      <mesh position={[0, 0.08, 0]}>
        <sphereGeometry args={[0.12, 8, 6]} />
        <meshStandardMaterial color="#e8d8b0" roughness={0.85} />
      </mesh>
      <mesh position={[0, -0.1, 0]}>
        <cylinderGeometry args={[0.07, 0.04, 0.2, 8]} />
        <meshStandardMaterial color="#e8d8b0" roughness={0.85} />
      </mesh>
    </group>
    {/* Tape roll */}
    <mesh position={[1.1, -0.3, 0]} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[0.08, 0.08, 0.1, 10]} />
      <meshStandardMaterial color="#e8d8b0" roughness={0.9} />
    </mesh>
  </group>
);

const ScoutPerch = ({ x, y, z }: { x: number; y: number; z: number }) => (
  <group position={[x, y, z]}>
    {/* Phone body */}
    <mesh>
      <boxGeometry args={[0.45, 0.92, 0.055]} />
      <meshStandardMaterial color="#1a1a1a" metalness={0.5} roughness={0.4} />
    </mesh>
    {/* Screen */}
    <group position={[0, 0, 0.028]}>
      <Suspense fallback={null}>
        <ScreenMesh
          imagePath="/screenshots/scout.png"
          width={0.39}
          height={0.82}
          glowColor="#4080ff"
        />
      </Suspense>
    </group>
  </group>
);

const SeedlingOutcrop = ({ x, y, z }: { x: number; y: number; z: number }) => (
  <group position={[x, y, z]}>
    {/* Phone body */}
    <mesh>
      <boxGeometry args={[0.45, 0.92, 0.055]} />
      <meshStandardMaterial color="#1a1a1a" metalness={0.5} roughness={0.4} />
    </mesh>
    {/* Screen */}
    <group position={[0, 0, 0.028]}>
      <Suspense fallback={null}>
        <ScreenMesh
          imagePath="/screenshots/seedling.png"
          width={0.39}
          height={0.82}
          glowColor="#40b060"
        />
      </Suspense>
    </group>
  </group>
);

const CommunityApproach = ({ x, y, z }: { x: number; y: number; z: number }) => (
  <group position={[x, y, z]}>
    {/* Phone body */}
    <mesh>
      <boxGeometry args={[0.45, 0.92, 0.055]} />
      <meshStandardMaterial color="#1a1a1a" metalness={0.5} roughness={0.4} />
    </mesh>
    {/* Screen */}
    <group position={[0, 0, 0.028]}>
      <Suspense fallback={null}>
        <ScreenMesh
          imagePath="/screenshots/community.png"
          width={0.39}
          height={0.82}
          glowColor="#8040e0"
        />
      </Suspense>
    </group>
    {/* 3 map pins (purple-tinted) */}
    {([-0.9, -0.6, -0.3] as number[]).map((x, i) => (
      <group key={i} position={[x, 0.6 + i * 0.15, 0.1]}>
        <mesh position={[0, 0.3, 0]}>
          <sphereGeometry args={[0.1, 8, 6]} />
          <meshStandardMaterial color="#9040d0" emissive="#6020a0" emissiveIntensity={0.5} />
        </mesh>
        <mesh>
          <coneGeometry args={[0.04, 0.35, 6]} />
          <meshStandardMaterial color="#7030b0" />
        </mesh>
      </group>
    ))}
  </group>
);

const SlalomGate = ({ x, y, z }: { x: number; y: number; z: number }) => (
  <IssueGateVisual x={x} y={y} z={z} />
);

const AboutSlope = ({ x, y, z }: { x: number; y: number; z: number }) => {
  const statsTex = useMemo(() => {
    const canvas  = document.createElement("canvas");
    canvas.width  = 512;
    canvas.height = 256;
    const ctx     = canvas.getContext("2d")!;
    ctx.fillStyle = "transparent";
    ctx.clearRect(0, 0, 512, 256);
    ctx.fillStyle = "rgba(240, 240, 255, 0.0)";
    ctx.fillRect(0, 0, 512, 256);

    ctx.fillStyle = "#e8f0ff";
    ctx.font      = "bold 28px sans-serif";
    ctx.fillText("14 years building.", 20, 50);
    ctx.font      = "22px sans-serif";
    ctx.fillStyle = "#c0d0f0";
    ctx.fillText("1 kid. Infinite problems to solve.", 20, 90);
    ctx.fillText("Not an expert. Someone doing the work.", 20, 128);

    ctx.font      = "bold 20px monospace";
    ctx.fillStyle = "#80a0d0";
    const stats = ["React / RN  14 yrs", "Flutter      3 yrs", "AI/Agents    2 yrs", "PostgreSQL   8 yrs"];
    stats.forEach((s, i) => ctx.fillText(s, 20, 168 + i * 26));

    return new THREE.CanvasTexture(canvas);
  }, []);

  return (
    <group position={[x, y, z]}>
      <mesh>
        <planeGeometry args={[5, 2.5]} />
        <meshStandardMaterial
          map={statsTex}
          transparent
          opacity={0.85}
          side={THREE.DoubleSide}
          roughness={0.9}
        />
      </mesh>
    </group>
  );
};

const ContactLanding = ({ x, y, z }: { x: number; y: number; z: number }) => (
  <group position={[x, y, z]}>
    {([-4, -1.5, 1.5, 4] as number[]).map((x, i) => (
      <group key={i} position={[x, 0.5, 1]}>
        <mesh>
          <boxGeometry args={[0.08, 0.6, 0.08]} />
          <meshStandardMaterial color="#fff8e0" emissive="#ffe8a0" emissiveIntensity={1.5} />
        </mesh>
        <pointLight color="#fff8e0" intensity={2} distance={8} decay={2} />
      </group>
    ))}
  </group>
);

// ── Trail marker plaque ────────────────────────────────────────────────────────

const EngravingPlaque = ({ x, y, z }: { x: number; y: number; z: number }) => (
  <group position={[x, y, z]}>
    {/* Stone slab */}
    <mesh>
      <boxGeometry args={[1.4, 0.75, 0.08]} />
      <meshStandardMaterial color="#5a6878" roughness={0.95} metalness={0.0} />
    </mesh>
    {/* Amber border — top */}
    <mesh position={[0, 0.355, 0.045]}>
      <boxGeometry args={[1.4, 0.04, 0.01]} />
      <meshStandardMaterial color="#C8860A" emissive="#C8860A" emissiveIntensity={1.2} roughness={0.4} />
    </mesh>
    {/* Amber border — bottom */}
    <mesh position={[0, -0.355, 0.045]}>
      <boxGeometry args={[1.4, 0.04, 0.01]} />
      <meshStandardMaterial color="#C8860A" emissive="#C8860A" emissiveIntensity={1.2} roughness={0.4} />
    </mesh>
    {/* Amber border — left */}
    <mesh position={[-0.68, 0, 0.045]}>
      <boxGeometry args={[0.04, 0.75, 0.01]} />
      <meshStandardMaterial color="#C8860A" emissive="#C8860A" emissiveIntensity={1.2} roughness={0.4} />
    </mesh>
    {/* Amber border — right */}
    <mesh position={[0.68, 0, 0.045]}>
      <boxGeometry args={[0.04, 0.75, 0.01]} />
      <meshStandardMaterial color="#C8860A" emissive="#C8860A" emissiveIntensity={1.2} roughness={0.4} />
    </mesh>
    {/* Warm ambient glow */}
    <pointLight position={[0, 0, 0.3]} color="#C8860A" intensity={0.6} distance={4} decay={2} />
  </group>
);

// ── Dispatcher ─────────────────────────────────────────────────────────────────

const LocationVisual = memo(({ x, y, z, visualType }: { x: number; y: number; z: number; visualType: string }) => {
  switch (visualType) {
    case "campfire":       return <BaseCamp x={x} y={y} z={z} />;
    case "laptop":         return <PrismLedge x={x} y={y} z={z} />;
    case "mac-mini":       return <AgentCave x={x} y={y} z={z} />;
    case "champion-slabs": return <LeagueLadsCrag x={x} y={y} z={z} />;
    case "bjj-gear":       return <BJJLedge x={x} y={y} z={z} />;
    case "phone-scout":    return <ScoutPerch x={x} y={y} z={z} />;
    case "phone-seedling": return <SeedlingOutcrop x={x} y={y} z={z} />;
    case "map-pins":       return <CommunityApproach x={x} y={y} z={z} />;
    case "slalom-gate":    return <SlalomGate x={x} y={y} z={z} />;
    case "snow-text":      return <AboutSlope x={x} y={y} z={z} />;
    case "lit-ground":     return <ContactLanding x={x} y={y} z={z} />;
    case "plaque":         return <EngravingPlaque x={x} y={y} z={z} />;
    default:               return null;
  }
});
