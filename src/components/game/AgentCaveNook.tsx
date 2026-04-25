// src/components/game/AgentCaveNook.tsx
// Easter egg E5: Hidden nook at the back wall of the Agent Cave.
// Approach reveals: "the real agent cave was in you all along"
import { useState, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import type { GamePhase } from "@/hooks/useGamePhase";

// Positioned ~5 units deeper into the cave than the cave's entrance center.
// Agent Cave entrance is at [-12, 24, 38]; this sits at the back wall.
const NOOK_POS: [number, number, number] = [-12, 23.6, 32.5];
const TRIGGER_RADIUS = 2.2;

type Props = {
  characterPos: THREE.Vector3;
  phase: GamePhase;
};

export const AgentCaveNook = ({ characterPos, phase }: Props) => {
  const [triggered, setTriggered]   = useState(false);
  const [visible, setVisible]       = useState(false);
  const suppressRef                 = useRef(false);
  const timerRef                    = useRef<ReturnType<typeof setTimeout> | null>(null);

  useFrame(() => {
    if (phase === "descent" || suppressRef.current) return;

    const dx = characterPos.x - NOOK_POS[0];
    const dy = characterPos.y - NOOK_POS[1];
    const dz = characterPos.z - NOOK_POS[2];
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

    if (dist < TRIGGER_RADIUS) {
      suppressRef.current = true;
      setTriggered(true);
      setVisible(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setVisible(false), 5500);
    }
  });

  return (
    <group position={NOOK_POS}>
      {/* Faint amber glow — barely visible until you're very close */}
      <pointLight color="#C8860A" intensity={triggered ? 0 : 0.18} distance={3} decay={2} />

      {/* Tiny recess marker — a recessed box with a subtle etched glow */}
      {!triggered && (
        <mesh>
          <boxGeometry args={[0.22, 0.22, 0.08]} />
          <meshStandardMaterial
            color="#1a1428"
            emissive="#C8860A"
            emissiveIntensity={0.15}
            roughness={0.9}
          />
        </mesh>
      )}

      {/* Reveal message */}
      {visible && (
        <Html
          position={[0, 1.2, 0]}
          center
          distanceFactor={10}
          style={{ pointerEvents: "none" }}
        >
          <div style={{
            background: "rgba(8,8,16,0.94)",
            border: "1px solid rgba(200,134,10,0.35)",
            borderRadius: "10px",
            padding: "10px 18px",
            fontFamily: "'DM Mono', monospace",
            fontSize: "11px",
            color: "#C8860A",
            letterSpacing: "0.07em",
            whiteSpace: "nowrap",
            backdropFilter: "blur(12px)",
            boxShadow: "0 0 20px rgba(200,134,10,0.15)",
            animation: "beaconFadeIn 0.5s ease both",
            textAlign: "center",
            lineHeight: 1.6,
          }}>
            the real agent cave<br />
            <span style={{ opacity: 0.7 }}>was in you all along</span>
          </div>
        </Html>
      )}
    </group>
  );
};
