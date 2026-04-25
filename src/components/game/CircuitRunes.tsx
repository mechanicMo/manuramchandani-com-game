// src/components/game/CircuitRunes.tsx
// Amber circuit-etching plates near tech project stops.
// Embodies the "Mountain and the Machine" theme — glowing runes in the rock.
import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { LOCATIONS } from "@/data/locations";
import type { GamePhase } from "@/hooks/useGamePhase";

const TECH_IDS = new Set([
  "prism-ledge",
  "agent-cave",
  "scout-perch",
  "seedling-outcrop",
  "meal-planner-ledge",
  "workshops-shelf",
  "leaguelads-crag",
  "community-approach",
]);

// Generate a unique circuit-rune canvas texture per plate (seeded random feel)
function makeRuneTex(seed: number): THREE.CanvasTexture {
  const W = 128, H = 128;
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // Dark stone base
  ctx.fillStyle = "#080b10";
  ctx.fillRect(0, 0, W, H);

  // Outer amber border
  ctx.strokeStyle = "rgba(200,134,10,0.55)";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(3, 3, W - 6, H - 6);
  ctx.strokeRect(6, 6, W - 12, H - 12);

  // Semi-deterministic circuit traces using seed
  const rng = (n: number) => ((Math.sin(seed * 9301 + n * 49297 + 233) + 1) / 2);

  ctx.strokeStyle = "rgba(200,134,10,0.7)";
  ctx.lineWidth = 1;

  // Horizontal traces
  for (let i = 0; i < 5; i++) {
    const y = 20 + i * 18;
    const x0 = 10 + rng(i * 3) * 20;
    const x1 = x0 + 20 + rng(i * 3 + 1) * 30;
    ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke();

    const x2 = W - 10 - rng(i * 3 + 2) * 25;
    const x3 = x2 - 15 - rng(i * 3 + 1) * 20;
    ctx.beginPath(); ctx.moveTo(x2, y); ctx.lineTo(x3, y); ctx.stroke();
  }

  // Vertical traces
  for (let j = 0; j < 3; j++) {
    const x = 28 + j * 36;
    const y0 = 10 + rng(j * 7) * 20;
    const y1 = y0 + 12 + rng(j * 7 + 1) * 18;
    ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, y1); ctx.stroke();

    const y2 = H - 10 - rng(j * 7 + 2) * 20;
    const y3 = y2 - 10 - rng(j * 7 + 3) * 15;
    ctx.beginPath(); ctx.moveTo(x, y2); ctx.lineTo(x, y3); ctx.stroke();
  }

  // Nodes (filled circles at intersections)
  ctx.fillStyle = "rgba(200,134,10,0.9)";
  for (let k = 0; k < 4; k++) {
    const nx = 20 + rng(k * 13) * 88;
    const ny = 20 + rng(k * 13 + 1) * 88;
    ctx.beginPath(); ctx.arc(nx, ny, 2.5, 0, Math.PI * 2); ctx.fill();
  }

  // Center sigil (small cross)
  const cx = W / 2 + (rng(99) - 0.5) * 12;
  const cy = H / 2 + (rng(100) - 0.5) * 12;
  ctx.strokeStyle = "rgba(200,134,10,0.85)";
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(cx - 6, cy); ctx.lineTo(cx + 6, cy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx, cy - 6); ctx.lineTo(cx, cy + 6); ctx.stroke();
  ctx.beginPath(); ctx.arc(cx, cy, 3.5, 0, Math.PI * 2); ctx.stroke();

  return new THREE.CanvasTexture(canvas);
}

type RunePlate = {
  pos: [number, number, number];
  seed: number;
};

type Props = { phase: GamePhase };

export const CircuitRunes = ({ phase }: Props) => {
  const lightRefs = useRef<(THREE.PointLight | null)[]>([]);

  const plates = useMemo<RunePlate[]>(() => {
    const result: RunePlate[] = [];
    let idx = 0;
    for (const loc of LOCATIONS) {
      if (!TECH_IDS.has(loc.id)) continue;
      // Two rune plates per stop: left and right
      result.push({ pos: [loc.x - 1.1, loc.y + 0.5, loc.z + 0.12], seed: idx++ });
      result.push({ pos: [loc.x + 1.1, loc.y + 0.5, loc.z + 0.12], seed: idx++ });
      // One above, smaller
      result.push({ pos: [loc.x, loc.y + 1.1, loc.z + 0.10], seed: idx++ });
    }
    return result;
  }, []);

  const textures = useMemo(() => plates.map(p => makeRuneTex(p.seed)), [plates]);

  useFrame(s => {
    const t = s.clock.elapsedTime;
    lightRefs.current.forEach((lr, i) => {
      if (lr) lr.intensity = 0.18 + Math.sin(t * 1.4 + i * 0.9) * 0.08;
    });
  });

  if (phase !== "ascent") return null;

  return (
    <>
      {plates.map((plate, i) => (
        <group key={i} position={plate.pos}>
          <mesh>
            <planeGeometry args={[0.3, 0.3]} />
            <meshBasicMaterial map={textures[i]} transparent opacity={0.8} side={THREE.DoubleSide} depthWrite={false} />
          </mesh>
          <pointLight
            ref={el => { lightRefs.current[i] = el; }}
            color="#C8860A"
            intensity={0.18}
            distance={2.5}
            decay={2}
          />
        </group>
      ))}
    </>
  );
};
