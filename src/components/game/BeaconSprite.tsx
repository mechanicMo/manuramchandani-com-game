// src/components/game/BeaconSprite.tsx
import { useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import {
  PROXIMITY_HINTS,
  ALTITUDE_HINTS,
  IDLE_HINTS,
} from "@/data/beacon-hints";
import { LOCATIONS } from "@/data/locations";
import type { GamePhase } from "@/hooks/useGamePhase";
import type { useAudioManager } from "@/hooks/useAudioManager";
import type { QualityLevel } from "@/hooks/useDeviceQuality";

type Props = {
  characterPos: THREE.Vector3;
  phase: GamePhase;
  onRequestOpenChat: () => void;
  audio: ReturnType<typeof useAudioManager>;
  muted: boolean;
  quality?: QualityLevel;
};

const TRAIL_COUNTS: Record<QualityLevel, number> = { high: 6, medium: 3, low: 2 };

const SPRING_STIFFNESS = 25;
const SPRING_DAMPING   = 0.6;
const HOVER_OFFSET     = new THREE.Vector3(1.2, 1.6, 0.2);
const _springTarget    = new THREE.Vector3();
const _toTarget        = new THREE.Vector3();
const _dampF           = new THREE.Vector3();
const HINT_COOLDOWN_MS  = 30_000;
const IDLE_THRESHOLD_MS = 15_000;
const PROXIMITY_RADIUS  = 8;
const PROXIMITY_RESET   = 10;

// Synthetic chirp — no asset file needed
let _syntheticCtx: AudioContext | null = null;

function playSyntheticChirp() {
  try {
    if (!_syntheticCtx) _syntheticCtx = new AudioContext();
    const ctx  = _syntheticCtx;
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
  } catch {
    // AudioContext blocked or not supported — silently ignore
  }
}

export const BeaconSprite = ({
  characterPos,
  phase,
  onRequestOpenChat,
  muted,
  quality = "high",
}: Props) => {
  const groupRef      = useRef<THREE.Group>(null!);
  const beaconPos     = useRef(new THREE.Vector3());
  const velocity      = useRef(new THREE.Vector3());
  const bobPhase      = useRef(0);

  const lastHintTime   = useRef<number>(0);
  const lastCharPos    = useRef(new THREE.Vector3());
  const lastMoveTime   = useRef<number>(Date.now());
  const idleIndex      = useRef(0);
  const firedProximity = useRef<Set<string>>(new Set());
  const lastAltY       = useRef<number>(0);
  const prevY          = useRef<number>(0);
  const initializedRef = useRef(false);

  const [hintText, setHintText] = useState<string | null>(null);
  const hintTimer      = useRef<ReturnType<typeof setTimeout> | null>(null);
  const spawnGreeted   = useRef(false);

  useEffect(() => {
    return () => { if (hintTimer.current) clearTimeout(hintTimer.current); };
  }, []);

  // One-shot spawn greeting
  useEffect(() => {
    const t = setTimeout(() => {
      if (spawnGreeted.current) return;
      spawnGreeted.current = true;
      lastHintTime.current = Date.now();
      setHintText("Hi, I'm Beacon. Press [C] to chat.");
      playSyntheticChirp();
      hintTimer.current = setTimeout(() => setHintText(null), 5000);
    }, 2000);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fireHint = (text: string) => {
    const now = Date.now();
    if (now - lastHintTime.current < HINT_COOLDOWN_MS) return;
    lastHintTime.current = now;

    setHintText(text);
    if (!muted) playSyntheticChirp();

    if (hintTimer.current) clearTimeout(hintTimer.current);
    hintTimer.current = setTimeout(() => setHintText(null), 4000);
  };

  useFrame((_, delta) => {
    if (!characterPos) return;
    const now = Date.now();

    if (!initializedRef.current) {
      const initTarget = characterPos.clone().add(HOVER_OFFSET);
      beaconPos.current.copy(initTarget);
      if (groupRef.current) groupRef.current.position.copy(initTarget);
      lastCharPos.current.copy(characterPos);
      prevY.current = characterPos.y;
      initializedRef.current = true;
      return;
    }

    // During descent: park beacon at character so it's ready when game resets to ascent
    if (phase === "descent") {
      beaconPos.current.copy(characterPos).add(HOVER_OFFSET);
      velocity.current.set(0, 0, 0);
      return;
    }

    // Spring movement with gentle bob
    bobPhase.current += delta * 0.8;
    const bobY = Math.sin(bobPhase.current) * 0.2;

    _springTarget.copy(characterPos).add(HOVER_OFFSET);
    _springTarget.y += bobY;
    _toTarget.copy(_springTarget).sub(beaconPos.current);
    _dampF.copy(velocity.current).multiplyScalar(SPRING_DAMPING * 2);
    // accel = springF - dampF; write into _toTarget to avoid another allocation
    _toTarget.multiplyScalar(SPRING_STIFFNESS).sub(_dampF);

    velocity.current.addScaledVector(_toTarget, delta);
    beaconPos.current.addScaledVector(velocity.current, delta);
    if (groupRef.current) groupRef.current.position.copy(beaconPos.current);

    // Idle detection
    const moved = characterPos.distanceTo(lastCharPos.current) > 0.05;
    if (moved) {
      lastMoveTime.current = now;
      lastCharPos.current.copy(characterPos);
    } else if (now - lastMoveTime.current > IDLE_THRESHOLD_MS) {
      const hint = IDLE_HINTS[idleIndex.current % IDLE_HINTS.length];
      idleIndex.current += 1;
      fireHint(hint.text);
      lastMoveTime.current = now;
    }

    // Proximity hints
    for (const loc of LOCATIONS) {
      const dist = Math.abs(characterPos.y - loc.y);
      if (!firedProximity.current.has(loc.id) && dist < PROXIMITY_RADIUS) {
        const hint = PROXIMITY_HINTS[loc.id];
        if (hint) {
          firedProximity.current.add(loc.id);
          fireHint(hint.text);
          break;
        }
      }
      if (firedProximity.current.has(loc.id) && dist > PROXIMITY_RESET) {
        firedProximity.current.delete(loc.id);
      }
    }

    // Altitude hints — ascending only, one-shot per session
    const currentY = characterPos.y;
    if (phase === "ascent" && currentY > prevY.current) {
      for (const hint of ALTITUDE_HINTS) {
        if (hint.yThreshold === undefined) continue;
        if (prevY.current < hint.yThreshold && currentY >= hint.yThreshold) {
          if (lastAltY.current < hint.yThreshold) {
            lastAltY.current = hint.yThreshold;
            fireHint(hint.text);
            break;
          }
        }
      }
    }
    prevY.current = currentY;
  });

  // Hidden during descent — a snowboarder doesn't need a floating AI companion
  if (phase === "descent") return null;

  return (
    <group ref={groupRef}>
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          onRequestOpenChat();
        }}
      >
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshBasicMaterial color="#7df9f0" />
      </mesh>

      <pointLight color="#7df9f0" intensity={0.8} distance={3} decay={2} />

      <TrailParticles parentPos={beaconPos} count={TRAIL_COUNTS[quality]} />

      {hintText && (
        <Html
          position={[0, 0.5, 0]}
          center
          distanceFactor={8}
          style={{ pointerEvents: "none" }}
        >
          <div
            style={{
              position: "relative",
              background: "rgba(8,8,16,0.88)",
              border: "1px solid rgba(125,249,240,0.45)",
              borderRadius: "8px",
              padding: "7px 12px",
              fontFamily: "'Inter', system-ui, sans-serif",
              fontSize: "12px",
              color: "rgba(250,248,244,0.9)",
              lineHeight: 1.5,
              backdropFilter: "blur(10px)",
              boxShadow: "0 0 12px rgba(125,249,240,0.15)",
              maxWidth: "220px",
              whiteSpace: "normal",
              textAlign: "center",
              animation: "beaconFadeIn 0.3s ease",
            }}
          >
            {hintText}
            <div
              style={{
                position: "absolute",
                bottom: "-6px",
                left: "50%",
                transform: "translateX(-50%)",
                width: 0,
                height: 0,
                borderLeft: "6px solid transparent",
                borderRight: "6px solid transparent",
                borderTop: "6px solid rgba(125,249,240,0.45)",
              }}
            />
          </div>
        </Html>
      )}
    </group>
  );
};

function TrailParticles({ parentPos, count }: { parentPos: React.MutableRefObject<THREE.Vector3>; count: number }) {
  const history  = useRef<THREE.Vector3[]>(
    Array.from({ length: count }, () => new THREE.Vector3())
  );
  const meshRefs = useRef<(THREE.Mesh | null)[]>(Array(count).fill(null));

  useFrame((_, delta) => {
    for (let i = count - 1; i > 0; i--) {
      history.current[i].lerp(history.current[i - 1], 1 - Math.exp(-12 * delta));
    }
    history.current[0].lerp(parentPos.current, 1 - Math.exp(-20 * delta));

    for (let i = 0; i < count; i++) {
      const mesh = meshRefs.current[i];
      if (!mesh) continue;
      mesh.position.copy(history.current[i]).sub(parentPos.current);
      (mesh.material as THREE.MeshBasicMaterial).opacity =
        (1 - i / count) * 0.5;
    }
  });

  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <mesh key={i} ref={(el) => { meshRefs.current[i] = el; }}>
          <sphereGeometry args={[Math.max(0.02, 0.06 - i * 0.007), 8, 8]} />
          <meshBasicMaterial color="#7df9f0" transparent opacity={0.5} />
        </mesh>
      ))}
    </>
  );
}
