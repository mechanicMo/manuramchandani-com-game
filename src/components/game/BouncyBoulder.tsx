// src/components/game/BouncyBoulder.tsx
// Easter egg E5: A specific boulder near spawn. Jump on it 3 times → super-launch upward.
// Landing detection: character Y stabilizes after a descending phase while within radius.
import { useState, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import type { GamePhase } from "@/hooks/useGamePhase";

// Fixed position — front cluster zone, near spawn, visually distinct (slightly larger, amber-tinted)
export const BOUNCY_BOULDER_POS: [number, number, number] = [8, 0.8, 58];
const XZ_RADIUS = 1.8;     // horizontal proximity to count a hop
const Y_MIN = -0.5;        // character Y must be above boulder base
const Y_MAX = 2.5;         // and not too high
const FALL_THRESHOLD = -0.09; // falling if dy < this per frame
const LAND_THRESHOLD = -0.02; // landed if dy > this after falling

type Props = {
  characterPos: THREE.Vector3;
  phase: GamePhase;
  launchRef: React.MutableRefObject<boolean>;
};

export const BouncyBoulder = ({ characterPos, phase, launchRef }: Props) => {
  const [hopCount, setHopCount] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const wasFallingRef  = useRef(false);
  const prevYRef       = useRef<number | null>(null);
  const hintTimerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firedRef       = useRef(false); // only launch once per approach

  useFrame(() => {
    if (phase === "descent") return;

    const curY = characterPos.y;
    if (prevYRef.current === null) {
      prevYRef.current = curY;
      return;
    }
    const dy = curY - prevYRef.current;
    prevYRef.current = curY;

    // Check XZ proximity to boulder
    const dx = characterPos.x - BOUNCY_BOULDER_POS[0];
    const dz = characterPos.z - BOUNCY_BOULDER_POS[2];
    const xzDist = Math.sqrt(dx * dx + dz * dz);
    const relY = curY - BOUNCY_BOULDER_POS[1];
    const nearBoulder = xzDist < XZ_RADIUS && relY > Y_MIN && relY < Y_MAX;

    // Landing detection
    if (dy < FALL_THRESHOLD) {
      wasFallingRef.current = true;
    } else if (wasFallingRef.current && dy > LAND_THRESHOLD) {
      wasFallingRef.current = false;
      if (nearBoulder) {
        setHopCount(prev => {
          const next = prev + 1;
          if (next >= 3 && !firedRef.current) {
            firedRef.current = true;
            launchRef.current = true;

            // Show launch hint
            setShowHint(true);
            if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
            hintTimerRef.current = setTimeout(() => {
              setShowHint(false);
              // Reset for another round
              firedRef.current = false;
              setHopCount(0);
            }, 4000);
          }
          return next >= 3 ? 0 : next;
        });
      }
    }

    // Reset hop count if player walks far away between hops
    if (!nearBoulder && hopCount > 0 && !firedRef.current) {
      setHopCount(0);
    }
  });

  return (
    <group position={BOUNCY_BOULDER_POS}>
      {/* Bouncy boulder — slightly larger, very subtly amber-tinted compared to normal boulders */}
      <mesh castShadow receiveShadow>
        <dodecahedronGeometry args={[1.05, 0]} />
        <meshBasicMaterial color="#2e2218" />
      </mesh>

      {/* Hop progress indicator — tiny floaty orbs that appear one by one */}
      {[0, 1, 2].map(i => (
        <mesh key={i} position={[-0.3 + i * 0.3, 1.5, 0]}>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshBasicMaterial color={i < hopCount ? "#C8860A" : "#2a2218"} />
        </mesh>
      ))}

      {/* Launch message */}
      {showHint && (
        <Html
          position={[0, 3.2, 0]}
          center
          distanceFactor={10}
          style={{ pointerEvents: "none" }}
        >
          <div style={{
            background: "rgba(8,8,16,0.94)",
            border: "1px solid rgba(200,134,10,0.5)",
            borderRadius: "10px",
            padding: "8px 16px",
            fontFamily: "'DM Mono', monospace",
            fontSize: "11px",
            color: "#C8860A",
            letterSpacing: "0.07em",
            whiteSpace: "nowrap",
            backdropFilter: "blur(12px)",
            animation: "beaconFadeIn 0.4s ease both",
          }}>
            you found it
          </div>
        </Html>
      )}
    </group>
  );
};
