// src/components/game/LocationVisuals.tsx
import { useRef, useMemo, memo, Suspense } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { LOCATIONS } from "@/data/locations";
import type { GamePhase } from "@/hooks/useGamePhase";
import { CampfireFlame } from "./CampfireFlame";
import { ScreenMesh } from "./ScreenMesh";
import { useMatcaps } from "@/hooks/useMatcaps";

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

// ── Per-location renderers ─────────────────────────────────────────────────────

const BaseCamp = ({ x, y, z }: { x: number; y: number; z: number }) => {
  const matcaps = useMatcaps();
  return (
    <group position={[x, y, z]}>
      <CampfireFlame />
      <mesh position={[0, -0.15, 0]} rotation={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.4, 0.5, 0.12, 6]} />
        <meshMatcapMaterial matcap={matcaps.wood} />
      </mesh>
      <mesh position={[1.4, 0.5, -0.3]} rotation={[0, 0.4, 0]}>
        <coneGeometry args={[0.7, 1.2, 3, 1]} />
        <meshMatcapMaterial matcap={matcaps.fabric} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[1.4, 0.5, 0.3]} rotation={[0, -0.4, 0]}>
        <coneGeometry args={[0.5, 1.0, 3, 1]} />
        <meshMatcapMaterial matcap={matcaps.fabric} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[-1.2, 0.05, 0.4]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.28, 0.05, 6, 16]} />
        <meshMatcapMaterial matcap={matcaps.wood} />
      </mesh>
      <mesh position={[-0.6, 0.12, 0.5]}>
        <cylinderGeometry args={[0.1, 0.09, 0.25, 8]} />
        <meshMatcapMaterial matcap={matcaps.fabric} />
      </mesh>
    </group>
  );
};

const PrismLedge = ({ x, y, z }: { x: number; y: number; z: number }) => {
  const matcaps = useMatcaps();
  return (
    <group position={[x, y, z]}>
      <mesh>
        <boxGeometry args={[0.7, 0.05, 0.5]} />
        <meshMatcapMaterial matcap={matcaps.plasticDark} />
      </mesh>
      <group position={[0, 0.025, -0.23]} rotation={[-(Math.PI * 110) / 180, 0, 0]}>
        <mesh>
          <boxGeometry args={[0.7, 0.45, 0.03]} />
          <meshMatcapMaterial matcap={matcaps.plasticDark} />
        </mesh>
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
};

const AgentCave = ({ x, y, z }: { x: number; y: number; z: number }) => {
  const matcaps = useMatcaps();
  const termTex = useMemo(() => makeTerminalTexture(), []);

  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.32, 0.04, 0.32]} />
        <meshMatcapMaterial matcap={matcaps.metalSoft} />
      </mesh>
      <group position={[0.5, 0.3, -0.1]} rotation={[0, -0.2, 0]}>
        <mesh>
          <boxGeometry args={[0.22, 0.16, 0.02]} />
          <meshMatcapMaterial matcap={matcaps.plasticDark} />
        </mesh>
        <mesh position={[0, 0, 0.011]}>
          <planeGeometry args={[0.2, 0.14]} />
          <meshBasicMaterial map={termTex} color="#00cc44" />
        </mesh>
        <pointLight position={[0, 0, 0.2]} color="#00cc44" intensity={1} distance={4} decay={2} />
      </group>
      {[0, 1, 2].map(i => (
        <mesh key={i} position={[-0.5, 0.02 + i * 0.013, 0.1 + i * 0.005]}>
          <boxGeometry args={[0.26, 0.01, 0.2]} />
          <meshMatcapMaterial matcap={matcaps.fabric} />
        </mesh>
      ))}
    </group>
  );
};

const LeagueLadsCrag = ({ x, y, z }: { x: number; y: number; z: number }) => (
  <group position={[x, y, z]}>
    {([-0.7, 0, 0.7] as number[]).map((ox, i) => (
      <group key={i} position={[ox, 0.6 + i * 0.1, 0]}>
        <mesh>
          <capsuleGeometry args={[0.14, 0.6 + i * 0.05, 4, 8]} />
          <meshBasicMaterial color="#8a6a10" />
        </mesh>
        <mesh position={[0, 0.55 + i * 0.025, 0]}>
          <sphereGeometry args={[0.12, 8, 6]} />
          <meshBasicMaterial color="#8a6a10" />
        </mesh>
      </group>
    ))}
    <pointLight position={[0, 1.5, 0.5]} color="#c8960a" intensity={1.2} distance={6} decay={2} />
  </group>
);

const BJJLedge = ({ x, y, z }: { x: number; y: number; z: number }) => {
  const matcaps = useMatcaps();
  return (
    <group position={[x, y, z]}>
      <mesh position={[-0.15, 0.3, 0]} rotation={[0, 0, 0.1]}>
        <boxGeometry args={[0.5, 1.1, 0.05]} />
        <meshMatcapMaterial matcap={matcaps.fabric} />
      </mesh>
      <mesh position={[0.15, 0.2, 0.02]} rotation={[0, 0, -0.1]}>
        <boxGeometry args={[0.45, 1.0, 0.04]} />
        <meshMatcapMaterial matcap={matcaps.fabric} />
      </mesh>
      <mesh position={[0, -0.2, 0.04]}>
        <boxGeometry args={[0.55, 0.06, 0.02]} />
        <meshMatcapMaterial matcap={matcaps.fabric} />
      </mesh>
      <mesh position={[0.9, 0.4, 0.05]} rotation={[0, 0, 0.3]}>
        <cylinderGeometry args={[0.02, 0.02, 0.35, 6]} />
        <meshMatcapMaterial matcap={matcaps.metalSoft} />
      </mesh>
      <group position={[-0.9, -0.1, 0]}>
        <mesh position={[0, 0.08, 0]}>
          <sphereGeometry args={[0.12, 8, 6]} />
          <meshMatcapMaterial matcap={matcaps.fabric} />
        </mesh>
        <mesh position={[0, -0.1, 0]}>
          <cylinderGeometry args={[0.07, 0.04, 0.2, 8]} />
          <meshMatcapMaterial matcap={matcaps.fabric} />
        </mesh>
      </group>
      <mesh position={[1.1, -0.3, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.1, 10]} />
        <meshMatcapMaterial matcap={matcaps.fabric} />
      </mesh>
    </group>
  );
};

const ScoutPerch = ({ x, y, z }: { x: number; y: number; z: number }) => {
  const matcaps = useMatcaps();
  return (
    <group position={[x, y, z]}>
      <mesh>
        <boxGeometry args={[0.45, 0.92, 0.055]} />
        <meshMatcapMaterial matcap={matcaps.plasticDark} />
      </mesh>
      <group position={[0, 0, 0.028]}>
        <Suspense fallback={null}>
          <ScreenMesh imagePath="/screenshots/scout.png" width={0.39} height={0.82} glowColor="#4080ff" />
        </Suspense>
      </group>
    </group>
  );
};

const SeedlingOutcrop = ({ x, y, z }: { x: number; y: number; z: number }) => {
  const matcaps = useMatcaps();
  return (
    <group position={[x, y, z]}>
      <mesh>
        <boxGeometry args={[0.45, 0.92, 0.055]} />
        <meshMatcapMaterial matcap={matcaps.plasticDark} />
      </mesh>
      <group position={[0, 0, 0.028]}>
        <Suspense fallback={null}>
          <ScreenMesh imagePath="/screenshots/seedling.png" width={0.39} height={0.82} glowColor="#40b060" />
        </Suspense>
      </group>
    </group>
  );
};

const CommunityApproach = ({ x, y, z }: { x: number; y: number; z: number }) => {
  const matcaps = useMatcaps();
  return (
    <group position={[x, y, z]}>
      <mesh>
        <boxGeometry args={[0.45, 0.92, 0.055]} />
        <meshMatcapMaterial matcap={matcaps.plasticDark} />
      </mesh>
      <group position={[0, 0, 0.028]}>
        <Suspense fallback={null}>
          <ScreenMesh imagePath="/screenshots/community.png" width={0.39} height={0.82} glowColor="#8040e0" />
        </Suspense>
      </group>
      {([-0.9, -0.6, -0.3] as number[]).map((ox, i) => (
        <group key={i} position={[ox, 0.6 + i * 0.15, 0.1]}>
          <mesh position={[0, 0.3, 0]}>
            <sphereGeometry args={[0.1, 8, 6]} />
            <meshBasicMaterial color="#9040d0" />
          </mesh>
          <mesh>
            <coneGeometry args={[0.04, 0.35, 6]} />
            <meshBasicMaterial color="#7030b0" />
          </mesh>
        </group>
      ))}
    </group>
  );
};

const ContactLanding = ({ x, y, z }: { x: number; y: number; z: number }) => (
  <group position={[x, y, z]}>
    {([-4, -1.5, 1.5, 4] as number[]).map((ox, i) => (
      <group key={i} position={[ox, 0.5, 1]}>
        <mesh>
          <boxGeometry args={[0.08, 0.6, 0.08]} />
          <meshBasicMaterial color="#ffe8a0" />
        </mesh>
        <pointLight color="#fff8e0" intensity={2} distance={8} decay={2} />
      </group>
    ))}
  </group>
);

// ── Summit Monolith ────────────────────────────────────────────────────────────

const MonolithVisual = ({ x, y, z }: { x: number; y: number; z: number }) => {
  const matcaps = useMatcaps();
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 1.4, 0]} castShadow>
        <boxGeometry args={[0.75, 2.8, 0.35]} />
        <meshMatcapMaterial matcap={matcaps.stoneDark} />
      </mesh>
      <mesh position={[0, 1.6, 0.18]}>
        <planeGeometry args={[0.5, 1.8]} />
        <meshBasicMaterial color="#C8860A" transparent opacity={0.7} />
      </mesh>
      {[0.7, 1.4, 2.1].map((yOff, i) => (
        <mesh key={i} position={[0, yOff, 0.185]}>
          <planeGeometry args={[0.45, 0.04]} />
          <meshBasicMaterial color="#C8860A" />
        </mesh>
      ))}
      <pointLight position={[0, 1.5, 0.5]} color="#C8860A" intensity={1.8} distance={8} decay={2} />
    </group>
  );
};

// ── Mountain Face Carving ──────────────────────────────────────────────────────

const FaceCarving = ({ x, y, z }: { x: number; y: number; z: number }) => {
  const runeTex = useMemo(() => {
    const canvas  = document.createElement("canvas");
    canvas.width  = 512;
    canvas.height = 256;
    const ctx     = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, 512, 256);

    ctx.fillStyle = "rgba(200,134,10,0.95)";
    ctx.font      = "bold 30px monospace";
    ctx.fillText("MANU RAMCHANDANI", 20, 60);

    ctx.strokeStyle = "rgba(200,134,10,0.4)";
    ctx.lineWidth   = 1.5;
    ctx.beginPath(); ctx.moveTo(10, 76); ctx.lineTo(490, 76); ctx.stroke();

    ctx.fillStyle = "rgba(200,134,10,0.72)";
    ctx.font      = "18px monospace";
    ctx.fillText("manu@manuramchandani.com", 20, 120);
    ctx.fillText("linkedin.com/in/manuramchandani", 20, 155);

    ctx.beginPath(); ctx.moveTo(10, 172); ctx.lineTo(490, 172); ctx.stroke();
    ctx.font      = "14px monospace";
    ctx.fillStyle = "rgba(200,134,10,0.45)";
    ctx.fillText("[E] to contact", 20, 200);

    return new THREE.CanvasTexture(canvas);
  }, []);

  return (
    <group position={[x, y, z]}>
      {/* Main slab */}
      <mesh position={[0, 1.1, 0]}>
        <boxGeometry args={[3.4, 2.4, 0.22]} />
        <meshBasicMaterial color="#18140e" />
      </mesh>
      {/* Base block */}
      <mesh position={[0, -0.08, 0]}>
        <boxGeometry args={[3.8, 0.22, 0.45]} />
        <meshBasicMaterial color="#141210" />
      </mesh>
      {/* Carved rune text */}
      <mesh position={[0, 1.1, 0.12]}>
        <planeGeometry args={[3.1, 2.1]} />
        <meshBasicMaterial map={runeTex} transparent opacity={0.88} />
      </mesh>
      {/* Amber border lines */}
      {([[-1.65, 1.1, 0.12], [1.65, 1.1, 0.12]] as [number,number,number][]).map((pos, i) => (
        <mesh key={i} position={pos}>
          <boxGeometry args={[0.04, 2.4, 0.01]} />
          <meshBasicMaterial color="#C8860A" />
        </mesh>
      ))}
      <pointLight position={[0, 1.1, 1.2]} color="#C8860A" intensity={1.8} distance={12} decay={2} />
    </group>
  );
};

// ── Snowboard Cache ────────────────────────────────────────────────────────────

const SnowboardRackVisual = ({ x, y, z }: { x: number; y: number; z: number }) => {
  const matcaps = useMatcaps();
  return (
    <group position={[x, y, z]}>
      <mesh position={[-0.75, 0.85, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 1.7, 6]} />
        <meshMatcapMaterial matcap={matcaps.metalSoft} />
      </mesh>
      <mesh position={[0.75, 0.85, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 1.7, 6]} />
        <meshMatcapMaterial matcap={matcaps.metalSoft} />
      </mesh>
      <mesh position={[0, 1.3, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.03, 0.03, 1.5, 6]} />
        <meshMatcapMaterial matcap={matcaps.metalSoft} />
      </mesh>
      <mesh position={[0.2, 0.85, 0.15]} rotation={[0.15, 0, 0.08]} castShadow>
        <boxGeometry args={[0.22, 1.55, 0.04]} />
        <meshMatcapMaterial matcap={matcaps.stoneLight} />
      </mesh>
      <mesh position={[0.2, 0.85, 0.17]} rotation={[0.15, 0, 0.08]}>
        <boxGeometry args={[0.22, 1.55, 0.005]} />
        <meshBasicMaterial color="#C8860A" />
      </mesh>
    </group>
  );
};

// ── Trail marker plaque ────────────────────────────────────────────────────────

const EngravingPlaque = ({ x, y, z }: { x: number; y: number; z: number }) => {
  const matcaps = useMatcaps();
  return (
    <group position={[x, y, z]}>
      <mesh>
        <boxGeometry args={[1.4, 0.75, 0.08]} />
        <meshMatcapMaterial matcap={matcaps.stoneDark} />
      </mesh>
      {/* Amber borders */}
      {[
        { pos: [0, 0.355, 0.045],  geo: [1.4, 0.04, 0.01] as [number,number,number] },
        { pos: [0, -0.355, 0.045], geo: [1.4, 0.04, 0.01] as [number,number,number] },
        { pos: [-0.68, 0, 0.045],  geo: [0.04, 0.75, 0.01] as [number,number,number] },
        { pos: [0.68, 0, 0.045],   geo: [0.04, 0.75, 0.01] as [number,number,number] },
      ].map((border, i) => (
        <mesh key={i} position={border.pos as [number,number,number]}>
          <boxGeometry args={border.geo} />
          <meshBasicMaterial color="#C8860A" />
        </mesh>
      ))}
      <pointLight position={[0, 0, 0.3]} color="#C8860A" intensity={0.6} distance={4} decay={2} />
    </group>
  );
};

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
    case "lit-ground":     return <ContactLanding x={x} y={y} z={z} />;
    case "plaque":         return <EngravingPlaque x={x} y={y} z={z} />;
    case "monolith":       return <MonolithVisual x={x} y={y} z={z} />;
    case "snowboard-rack": return <SnowboardRackVisual x={x} y={y} z={z} />;
    case "carved-stone":   return <FaceCarving x={x} y={y} z={z} />;
    default:               return null;
  }
});
