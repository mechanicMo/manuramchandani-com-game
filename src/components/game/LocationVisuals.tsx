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
      {locations.map(loc => {
        const detail = loc.content.type === "vignette"
          ? loc.content.text.split("\n").slice(1).join(" ")
          : undefined;
        return (
          <LocationVisual key={loc.id} x={loc.x} y={loc.y} z={loc.z} visualType={loc.visualType} name={loc.name} detail={detail} />
        );
      })}
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

const NewsletterKiosk = ({ x, y, z }: { x: number; y: number; z: number }) => {
  const matcaps = useMatcaps();

  const screenTex = useMemo(() => {
    const canvas  = document.createElement("canvas");
    canvas.width  = 512;
    canvas.height = 320;
    const ctx     = canvas.getContext("2d")!;

    // Dark terminal background
    ctx.fillStyle = "#060810";
    ctx.fillRect(0, 0, 512, 320);

    // Amber border lines
    ctx.strokeStyle = "rgba(200,134,10,0.5)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(10, 10, 492, 300);

    // Header label
    ctx.fillStyle = "rgba(200,134,10,0.55)";
    ctx.font = "bold 13px monospace";
    ctx.fillText("SLEEPING EMPLOYEES", 24, 42);

    // Divider
    ctx.strokeStyle = "rgba(200,134,10,0.3)";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(24, 54); ctx.lineTo(488, 54); ctx.stroke();

    // Main title
    ctx.fillStyle = "rgba(250,248,244,0.92)";
    ctx.font = "bold 26px sans-serif";
    ctx.fillText("The weekly dispatch.", 24, 96);

    // Description
    ctx.font = "16px sans-serif";
    ctx.fillStyle = "rgba(250,248,244,0.6)";
    ctx.fillText("One builder, shipping in public.", 24, 128);
    ctx.fillText("Every week.", 24, 152);

    // CTA divider
    ctx.strokeStyle = "rgba(200,134,10,0.3)";
    ctx.beginPath(); ctx.moveTo(24, 174); ctx.lineTo(488, 174); ctx.stroke();

    // CTA
    ctx.font = "bold 18px monospace";
    ctx.fillStyle = "#C8860A";
    ctx.fillText("sleepingemployees.com", 24, 212);

    ctx.font = "13px monospace";
    ctx.fillStyle = "rgba(200,134,10,0.5)";
    ctx.fillText("[E] to open", 24, 244);

    return new THREE.CanvasTexture(canvas);
  }, []);

  return (
    <group position={[x, y, z]}>
      {/* Post */}
      <mesh position={[0, 0.9, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.12, 1.8, 8]} />
        <meshMatcapMaterial matcap={matcaps.stoneDark} />
      </mesh>
      {/* Post base */}
      <mesh position={[0, 0.06, 0]} receiveShadow>
        <cylinderGeometry args={[0.28, 0.32, 0.12, 10]} />
        <meshMatcapMaterial matcap={matcaps.stoneDark} />
      </mesh>
      {/* Monitor housing */}
      <mesh position={[0, 1.98, 0.06]} castShadow>
        <boxGeometry args={[1.9, 1.25, 0.18]} />
        <meshMatcapMaterial matcap={matcaps.stoneDark} />
      </mesh>
      {/* Screen bezel — inner dark frame */}
      <mesh position={[0, 1.98, 0.16]}>
        <boxGeometry args={[1.72, 1.08, 0.04]} />
        <meshBasicMaterial color="#060810" />
      </mesh>
      {/* Screen surface */}
      <mesh position={[0, 1.98, 0.19]}>
        <planeGeometry args={[1.6, 1.0]} />
        <meshBasicMaterial map={screenTex} transparent opacity={0.95} />
      </mesh>
      {/* Screen glow */}
      <pointLight position={[0, 2, 0.6]} color="#C8860A" intensity={1.2} distance={10} decay={2} />
    </group>
  );
};

// ── Summit Monolith ────────────────────────────────────────────────────────────

const MonolithVisual = ({ x, y, z }: { x: number; y: number; z: number }) => {
  const matcaps = useMatcaps();

  const faceTex = useMemo(() => {
    const canvas  = document.createElement("canvas");
    canvas.width  = 256;
    canvas.height = 512;
    const ctx     = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, 256, 512);

    // Carved name — large amber
    ctx.textAlign   = "center";
    ctx.fillStyle   = "rgba(200,134,10,0.95)";
    ctx.font        = "bold 28px monospace";
    ctx.fillText("MANU", 128, 72);
    ctx.fillText("RAMCHANDANI", 128, 108);

    // Divider
    ctx.strokeStyle = "rgba(200,134,10,0.35)";
    ctx.lineWidth   = 1;
    ctx.beginPath(); ctx.moveTo(30, 126); ctx.lineTo(226, 126); ctx.stroke();

    // Circuit-rune accent lines
    for (let i = 0; i < 3; i++) {
      const ry = 148 + i * 12;
      ctx.strokeStyle = `rgba(200,134,10,${0.18 - i * 0.04})`;
      ctx.lineWidth   = 1;
      ctx.beginPath(); ctx.moveTo(30, ry); ctx.lineTo(226, ry); ctx.stroke();
    }

    // Email field
    ctx.fillStyle = "rgba(200,134,10,0.75)";
    ctx.font      = "12px monospace";
    ctx.fillText("manu@manuramchandani.com", 128, 218);

    ctx.strokeStyle = "rgba(200,134,10,0.2)";
    ctx.beginPath(); ctx.moveTo(30, 232); ctx.lineTo(226, 232); ctx.stroke();

    // LinkedIn
    ctx.fillStyle = "rgba(200,134,10,0.60)";
    ctx.font      = "11px monospace";
    ctx.fillText("linkedin.com/in/", 128, 266);
    ctx.fillText("manuramchandani", 128, 284);

    ctx.strokeStyle = "rgba(200,134,10,0.2)";
    ctx.beginPath(); ctx.moveTo(30, 298); ctx.lineTo(226, 298); ctx.stroke();

    // GitHub
    ctx.fillStyle = "rgba(200,134,10,0.45)";
    ctx.font      = "11px monospace";
    ctx.fillText("github.com/mechanicMo", 128, 326);

    // Bottom divider + interact hint
    ctx.strokeStyle = "rgba(200,134,10,0.25)";
    ctx.beginPath(); ctx.moveTo(30, 380); ctx.lineTo(226, 380); ctx.stroke();
    ctx.fillStyle = "rgba(200,134,10,0.35)";
    ctx.font      = "10px monospace";
    ctx.fillText("[E] to copy", 128, 404);

    return new THREE.CanvasTexture(canvas);
  }, []);

  return (
    <group position={[x, y, z]}>
      {/* Stone body — tall narrow megalith */}
      <mesh position={[0, 1.8, 0]} castShadow>
        <boxGeometry args={[0.90, 3.6, 0.42]} />
        <meshMatcapMaterial matcap={matcaps.stoneDark} />
      </mesh>
      {/* Slight taper at top */}
      <mesh position={[0, 3.62, 0]} castShadow>
        <boxGeometry args={[0.78, 0.28, 0.38]} />
        <meshMatcapMaterial matcap={matcaps.stoneDark} />
      </mesh>
      {/* Carved face — front panel with rune text */}
      <mesh position={[0, 1.9, 0.22]}>
        <planeGeometry args={[0.78, 3.2]} />
        <meshBasicMaterial map={faceTex} transparent opacity={0.92} />
      </mesh>
      {/* Amber side accent lines */}
      {([-0.44, 0.44] as number[]).map((ox, i) => (
        <mesh key={i} position={[ox, 1.8, 0.22]}>
          <planeGeometry args={[0.025, 3.2]} />
          <meshBasicMaterial color="#C8860A" transparent opacity={0.5} />
        </mesh>
      ))}
      {/* Base plinth */}
      <mesh position={[0, 0.12, 0]} receiveShadow>
        <boxGeometry args={[1.3, 0.24, 0.7]} />
        <meshMatcapMaterial matcap={matcaps.stoneDark} />
      </mesh>
      {/* Snow accumulation on top */}
      <mesh position={[0, 3.8, 0]}>
        <boxGeometry args={[0.88, 0.10, 0.40]} />
        <meshMatcapMaterial matcap={matcaps.snow} />
      </mesh>
      {/* Warm amber glow — casts on nearby snow */}
      <pointLight position={[0, 1.8, 0.8]} color="#C8860A" intensity={2.2} distance={10} decay={2} />
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
    // Rotated 180° so the carved face points toward +Z (toward the player approaching from z=65)
    <group position={[x, y, z]} rotation={[0, Math.PI, 0]}>
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
      {/* Carved rune text — at -0.12 so after Y-rotation it's world +0.12 (in front of slab) */}
      <mesh position={[0, 1.1, -0.12]}>
        <planeGeometry args={[3.1, 2.1]} />
        <meshBasicMaterial map={runeTex} transparent opacity={0.88} />
      </mesh>
      {/* Amber border lines */}
      {([[-1.65, 1.1, -0.12], [1.65, 1.1, -0.12]] as [number,number,number][]).map((pos, i) => (
        <mesh key={i} position={pos}>
          <boxGeometry args={[0.04, 2.4, 0.01]} />
          <meshBasicMaterial color="#C8860A" />
        </mesh>
      ))}
      <pointLight position={[0, 1.1, -1.2]} color="#C8860A" intensity={1.8} distance={12} decay={2} />
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

const EngravingPlaque = ({ x, y, z, name, detail }: { x: number; y: number; z: number; name?: string; detail?: string }) => {
  const matcaps = useMatcaps();

  const plaqueTex = useMemo(() => {
    const canvas  = document.createElement("canvas");
    canvas.width  = 256;
    canvas.height = 160;
    const ctx     = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, 256, 160);
    if (name) {
      ctx.textAlign   = "center";
      ctx.fillStyle   = "rgba(200,134,10,0.92)";
      ctx.font        = "bold 54px monospace";
      ctx.fillText(name, 128, 66);
      ctx.strokeStyle = "rgba(200,134,10,0.30)";
      ctx.lineWidth   = 1;
      ctx.beginPath(); ctx.moveTo(32, 80); ctx.lineTo(224, 80); ctx.stroke();
    }
    if (detail) {
      ctx.fillStyle = "rgba(250,248,244,0.60)";
      ctx.font      = "13px sans-serif";
      ctx.fillText(detail, 128, 108, 210);
    }
    return new THREE.CanvasTexture(canvas);
  }, [name, detail]);

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
      {/* Year + milestone text */}
      <mesh position={[0, 0, 0.046]}>
        <planeGeometry args={[1.2, 0.75]} />
        <meshBasicMaterial map={plaqueTex} transparent opacity={0.9} />
      </mesh>
      <pointLight position={[0, 0, 0.3]} color="#C8860A" intensity={0.6} distance={4} decay={2} />
    </group>
  );
};

// ── Meal Planner ──────────────────────────────────────────────────────────────

const MealPlannerLedge = ({ x, y, z }: { x: number; y: number; z: number }) => {
  const matcaps = useMatcaps();

  const screenTex = useMemo(() => {
    const canvas  = document.createElement("canvas");
    canvas.width  = 256;
    canvas.height = 448;
    const ctx     = canvas.getContext("2d")!;

    ctx.fillStyle = "#0a0e08";
    ctx.fillRect(0, 0, 256, 448);

    ctx.fillStyle = "rgba(80,160,60,0.12)";
    ctx.fillRect(0, 0, 256, 64);

    ctx.fillStyle = "#50a03c";
    ctx.font = "bold 13px monospace";
    ctx.fillText("MEAL PLANNER", 16, 28);

    ctx.strokeStyle = "rgba(80,160,60,0.3)";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(12, 42); ctx.lineTo(244, 42); ctx.stroke();

    ctx.fillStyle = "rgba(250,248,244,0.75)";
    ctx.font = "bold 15px sans-serif";
    ctx.fillText("This week", 16, 72);

    const meals = ["Mon  Chicken stir-fry", "Tue  Lentil soup", "Wed  Pasta bake", "Thu  Salmon tacos", "Fri  Veggie bowl"];
    meals.forEach((meal, i) => {
      ctx.fillStyle = i % 2 === 0 ? "rgba(80,160,60,0.08)" : "transparent";
      ctx.fillRect(0, 90 + i * 36, 256, 36);
      ctx.fillStyle = "rgba(250,248,244,0.70)";
      ctx.font = "12px sans-serif";
      ctx.fillText(meal, 16, 113 + i * 36);
    });

    ctx.strokeStyle = "rgba(80,160,60,0.25)";
    ctx.beginPath(); ctx.moveTo(12, 280); ctx.lineTo(244, 280); ctx.stroke();

    ctx.fillStyle = "#50a03c";
    ctx.font = "bold 12px monospace";
    ctx.fillText("Receipt → Recipe", 16, 308);
    ctx.fillStyle = "rgba(250,248,244,0.45)";
    ctx.font = "11px sans-serif";
    ctx.fillText("Scan any grocery receipt.", 16, 332);
    ctx.fillText("Gemini AI generates the", 16, 352);
    ctx.fillText("week's meals automatically.", 16, 372);

    return new THREE.CanvasTexture(canvas);
  }, []);

  return (
    <group position={[x, y, z]}>
      <mesh>
        <boxGeometry args={[0.45, 0.92, 0.055]} />
        <meshMatcapMaterial matcap={matcaps.plasticDark} />
      </mesh>
      <group position={[0, 0, 0.028]}>
        <mesh>
          <planeGeometry args={[0.39, 0.82]} />
          <meshBasicMaterial map={screenTex} transparent opacity={0.95} />
        </mesh>
      </group>
      <pointLight position={[0, 0, 0.4]} color="#50a03c" intensity={0.8} distance={5} decay={2} />
    </group>
  );
};

// ── Workshops ──────────────────────────────────────────────────────────────────

const WorkshopsShelf = ({ x, y, z }: { x: number; y: number; z: number }) => {
  const matcaps = useMatcaps();

  const screenTex = useMemo(() => {
    const canvas  = document.createElement("canvas");
    canvas.width  = 512;
    canvas.height = 320;
    const ctx     = canvas.getContext("2d")!;

    ctx.fillStyle = "#080a10";
    ctx.fillRect(0, 0, 512, 320);

    ctx.fillStyle = "rgba(80,120,200,0.15)";
    ctx.fillRect(0, 0, 512, 56);

    ctx.fillStyle = "#7090d0";
    ctx.font = "bold 13px monospace";
    ctx.fillText("WORKSHOPS", 20, 26);

    ctx.fillStyle = "rgba(250,248,244,0.45)";
    ctx.font = "11px sans-serif";
    ctx.fillText("e-learning platform", 20, 44);

    ctx.strokeStyle = "rgba(80,120,200,0.3)";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(12, 64); ctx.lineTo(500, 64); ctx.stroke();

    const courses = [
      { title: "React + TypeScript", progress: 0.78, color: "#6090e0" },
      { title: "Modern Web Dev",    progress: 0.45, color: "#5080cc" },
      { title: "Supabase Backends", progress: 0.92, color: "#4070b8" },
    ];

    courses.forEach(({ title, progress, color }, i) => {
      const cardY = 80 + i * 78;
      ctx.fillStyle = "rgba(80,120,200,0.08)";
      ctx.fillRect(12, cardY, 488, 66);
      ctx.strokeStyle = "rgba(80,120,200,0.2)";
      ctx.strokeRect(12, cardY, 488, 66);

      ctx.fillStyle = "rgba(250,248,244,0.80)";
      ctx.font = "bold 14px sans-serif";
      ctx.fillText(title, 24, cardY + 24);

      ctx.fillStyle = "rgba(80,120,200,0.25)";
      ctx.fillRect(24, cardY + 38, 440, 8);
      ctx.fillStyle = color;
      ctx.fillRect(24, cardY + 38, 440 * progress, 8);

      ctx.fillStyle = "rgba(250,248,244,0.45)";
      ctx.font = "10px monospace";
      ctx.fillText(`${Math.round(progress * 100)}%`, 24 + 440 * progress + 4, cardY + 47);
    });

    return new THREE.CanvasTexture(canvas);
  }, []);

  return (
    <group position={[x, y, z]}>
      {/* Laptop base */}
      <mesh position={[0, -0.02, 0.15]} receiveShadow>
        <boxGeometry args={[0.75, 0.03, 0.52]} />
        <meshMatcapMaterial matcap={matcaps.plasticDark} />
      </mesh>
      {/* Screen + hinge */}
      <group position={[0, 0.02, -0.08]} rotation={[-(Math.PI * 105) / 180, 0, 0]}>
        <mesh>
          <boxGeometry args={[0.75, 0.50, 0.03]} />
          <meshMatcapMaterial matcap={matcaps.plasticDark} />
        </mesh>
        <mesh position={[0, 0, 0.016]}>
          <planeGeometry args={[0.68, 0.44]} />
          <meshBasicMaterial map={screenTex} transparent opacity={0.92} />
        </mesh>
      </group>
      <pointLight position={[0, 0.3, 0.4]} color="#6090e0" intensity={1.0} distance={6} decay={2} />
    </group>
  );
};

// ── Dispatcher ─────────────────────────────────────────────────────────────────

const LocationVisual = memo(({ x, y, z, visualType, name, detail }: { x: number; y: number; z: number; visualType: string; name?: string; detail?: string }) => {
  switch (visualType) {
    case "campfire":       return <BaseCamp x={x} y={y} z={z} />;
    case "laptop":         return <PrismLedge x={x} y={y} z={z} />;
    case "mac-mini":       return <AgentCave x={x} y={y} z={z} />;
    case "champion-slabs": return <LeagueLadsCrag x={x} y={y} z={z} />;
    case "bjj-gear":       return <BJJLedge x={x} y={y} z={z} />;
    case "phone-scout":    return <ScoutPerch x={x} y={y} z={z} />;
    case "phone-seedling":    return <SeedlingOutcrop x={x} y={y} z={z} />;
    case "phone-meal":        return <MealPlannerLedge x={x} y={y} z={z} />;
    case "map-pins":          return <CommunityApproach x={x} y={y} z={z} />;
    case "tablet-workshops":  return <WorkshopsShelf x={x} y={y} z={z} />;
    case "kiosk":          return <NewsletterKiosk x={x} y={y} z={z} />;
    case "plaque":         return <EngravingPlaque x={x} y={y} z={z} name={name} detail={detail} />;
    case "monolith":       return <MonolithVisual x={x} y={y} z={z} />;
    case "snowboard-rack": return <SnowboardRackVisual x={x} y={y} z={z} />;
    case "carved-stone":   return <FaceCarving x={x} y={y} z={z} />;
    default:               return null;
  }
});
