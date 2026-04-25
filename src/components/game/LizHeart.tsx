// src/components/game/LizHeart.tsx
// Easter egg: a small photo frame propped near the base camp fire.
// A quiet nod to Liz — no label, no explanation. Just a frame with a heart.
// Proximity triggers a soft reveal message once per session.
import { useState, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";

// Tucked to the right of the campfire, slightly behind it — visible if you
// circle the fire but not obvious from the main walk path.
const FRAME_POS: [number, number, number] = [10, 0.55, 52];
const TRIGGER_RADIUS = 2.2;

export const LizHeart = ({ characterPos }: { characterPos: THREE.Vector3 }) => {
  const [visible, setVisible]   = useState(false);
  const suppressRef = useRef(false);
  const timerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);

  useFrame(() => {
    if (suppressRef.current) return;
    const dx = characterPos.x - FRAME_POS[0];
    const dy = characterPos.y - FRAME_POS[1];
    const dz = characterPos.z - FRAME_POS[2];
    if (Math.sqrt(dx * dx + dy * dy + dz * dz) < TRIGGER_RADIUS) {
      suppressRef.current = true;
      setVisible(true);
      timerRef.current = setTimeout(() => setVisible(false), 4000);
    }
  });

  return (
    <group position={FRAME_POS} rotation={[0, -0.45, 0]}>
      {/* Outer frame — dark wood */}
      <mesh castShadow>
        <boxGeometry args={[0.52, 0.66, 0.04]} />
        <meshBasicMaterial color="#241508" />
      </mesh>
      {/* Inner photo mat — warm ivory */}
      <mesh position={[0, 0, 0.022]}>
        <boxGeometry args={[0.40, 0.54, 0.01]} />
        <meshBasicMaterial color="#f4e9d6" />
      </mesh>

      {/* Heart — two lobes + diamond bottom, all amber */}
      <mesh position={[-0.052, 0.04, 0.032]}>
        <sphereGeometry args={[0.062, 10, 10]} />
        <meshBasicMaterial color="#C8860A" />
      </mesh>
      <mesh position={[0.052, 0.04, 0.032]}>
        <sphereGeometry args={[0.062, 10, 10]} />
        <meshBasicMaterial color="#C8860A" />
      </mesh>
      <mesh position={[0, -0.042, 0.032]} rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[0.088, 0.088, 0.01]} />
        <meshBasicMaterial color="#C8860A" />
      </mesh>

      {/* Frame stand — tiny wedge propping it up from behind */}
      <mesh position={[0, -0.22, -0.05]} rotation={[0.35, 0, 0]}>
        <boxGeometry args={[0.07, 0.28, 0.025]} />
        <meshBasicMaterial color="#241508" />
      </mesh>

      {/* Faint warm glow so it's barely findable in the dark */}
      <pointLight color="#C8860A" intensity={0.25} distance={5} decay={2} />

      {visible && (
        <Html
          position={[0, 0.62, 0]}
          center
          distanceFactor={8}
          style={{ pointerEvents: "none" }}
        >
          <div
            style={{
              background: "rgba(8,8,16,0.88)",
              border: "1px solid rgba(200,134,10,0.35)",
              borderRadius: "8px",
              padding: "6px 14px",
              fontFamily: "'DM Mono', monospace",
              fontSize: "11px",
              color: "#C8860A",
              letterSpacing: "0.07em",
              whiteSpace: "nowrap",
              backdropFilter: "blur(10px)",
              boxShadow: "0 0 12px rgba(200,134,10,0.12)",
              animation: "beaconFadeIn 0.4s ease both",
            }}
          >
            ♥ Liz
          </div>
        </Html>
      )}
    </group>
  );
};
