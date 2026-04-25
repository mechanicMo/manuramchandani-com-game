// src/components/game/BJJBelts.tsx
// Easter egg E5: Three hidden BJJ belts scattered on the mountain.
// Collecting all three shows a completion message via drei Html.
import { useState, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import type { GamePhase } from "@/hooks/useGamePhase";

type Props = {
  characterPos: THREE.Vector3;
  phase: GamePhase;
};

type Belt = {
  id: "white" | "blue" | "purple";
  position: [number, number, number];
  color: string;
  emissive: string;
  label: string;
};

const BELTS: Belt[] = [
  {
    id: "white",
    position: [12, 0.6, 64],
    color: "#e8e8f0",
    emissive: "#888899",
    label: "White Belt — found. The beginning.",
  },
  {
    id: "blue",
    position: [-6, 36, 32],
    color: "#2244aa",
    emissive: "#112266",
    label: "Blue Belt — found. Keep drilling.",
  },
  {
    id: "purple",
    position: [5, 67, 14],
    color: "#6622aa",
    emissive: "#330055",
    label: "Purple Belt — found. Almost there.",
  },
];

const COLLECT_RADIUS = 2.5;

export const BJJBelts = ({ characterPos, phase }: Props) => {
  const [collected, setCollected] = useState<Set<string>>(new Set());
  const [lastPickup, setLastPickup] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const pickupTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const allTimer    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressRef = useRef<Set<string>>(new Set()); // prevent re-collecting after first grab

  useFrame(() => {
    if (phase === "descent") return;

    for (const belt of BELTS) {
      if (collected.has(belt.id) || suppressRef.current.has(belt.id)) continue;
      const [bx, by, bz] = belt.position;
      const dx = characterPos.x - bx;
      const dy = characterPos.y - by;
      const dz = characterPos.z - bz;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (dist < COLLECT_RADIUS) {
        suppressRef.current.add(belt.id);
        setCollected(prev => {
          const next = new Set(prev);
          next.add(belt.id);
          if (next.size === BELTS.length) {
            // All collected — brief celebration message
            if (allTimer.current) clearTimeout(allTimer.current);
            setShowAll(true);
            allTimer.current = setTimeout(() => setShowAll(false), 6000);
          }
          return next;
        });
        setLastPickup(belt.label);
        if (pickupTimer.current) clearTimeout(pickupTimer.current);
        pickupTimer.current = setTimeout(() => setLastPickup(null), 3000);
        break;
      }
    }
  });

  return (
    <>
      {/* Render uncollected belts */}
      {BELTS.filter(b => !collected.has(b.id)).map(belt => (
        <BeltMesh key={belt.id} belt={belt} />
      ))}

      {/* Pickup notification via floating label at character position */}
      {lastPickup && (
        <Html
          position={[characterPos.x, characterPos.y + 3, characterPos.z]}
          center
          distanceFactor={12}
          style={{ pointerEvents: "none" }}
        >
          <div style={{
            background: "rgba(8,8,16,0.88)",
            border: "1px solid rgba(200,134,10,0.45)",
            borderRadius: "8px",
            padding: "6px 14px",
            fontFamily: "'DM Mono', monospace",
            fontSize: "11px",
            color: "#C8860A",
            letterSpacing: "0.08em",
            whiteSpace: "nowrap",
            backdropFilter: "blur(10px)",
          }}>
            {lastPickup}
          </div>
        </Html>
      )}

      {/* All collected — special message */}
      {showAll && (
        <Html
          position={[characterPos.x, characterPos.y + 4.5, characterPos.z]}
          center
          distanceFactor={10}
          style={{ pointerEvents: "none" }}
        >
          <div style={{
            background: "rgba(8,8,16,0.92)",
            border: "1px solid rgba(102,34,170,0.6)",
            borderRadius: "10px",
            padding: "10px 18px",
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: "13px",
            color: "rgba(250,248,244,0.9)",
            lineHeight: 1.5,
            backdropFilter: "blur(12px)",
            boxShadow: "0 0 16px rgba(102,34,170,0.25)",
            maxWidth: "240px",
            textAlign: "center",
          }}>
            All three belts collected.<br />
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", color: "#C8860A" }}>
              10th Planet would be proud.
            </span>
          </div>
        </Html>
      )}
    </>
  );
};

// Individual belt mesh — a flat ribbon hanging in space, gently rotating
const BeltMesh = ({ belt }: { belt: Belt }) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    groupRef.current.rotation.y = Math.sin(t * 0.6) * 0.25;
    groupRef.current.position.y = belt.position[1] + 0.5 + Math.sin(t * 1.2) * 0.12;
  });

  return (
    <group
      ref={groupRef}
      position={belt.position}
    >
      {/* Belt body — flat and wide */}
      <mesh>
        <boxGeometry args={[0.8, 0.12, 0.04]} />
        <meshBasicMaterial color={belt.color} />
      </mesh>
      {/* Belt knot — small box in center */}
      <mesh position={[0, 0, 0.03]}>
        <boxGeometry args={[0.12, 0.16, 0.06]} />
        <meshBasicMaterial color={belt.color} />
      </mesh>
      {/* Subtle point light so belt glows slightly */}
      <pointLight color={belt.color} intensity={0.4} distance={4} decay={2} />
    </group>
  );
};
