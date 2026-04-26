// src/components/game/SummitObjects.tsx
// Summit decorations: Beacon pyre (interactive — light it with E) + Sherani snowman.
// Monolith and SnowboardCache are rendered via LocationVisuals (they have location entries).
import { useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { CampfireFlame } from "./CampfireFlame";
import type { GamePhase } from "@/hooks/useGamePhase";
import { useMatcaps } from "@/hooks/useMatcaps";

const IS_TOUCH = "ontouchstart" in window || navigator.maxTouchPoints > 0;

const SUMMIT_Y = 82;
const PYRE_POS: [number, number, number] = [-4, SUMMIT_Y, -3];
const PYRE_INTERACT_RADIUS = 3.5;

// Shared unit geometries — module-level to avoid re-allocation
const LOG_GEO    = new THREE.CylinderGeometry(0.07, 0.09, 1.1, 6);
const BEACON_GEO = new THREE.SphereGeometry(0.6, 8, 8);
const CAIRN_GEO  = new THREE.DodecahedronGeometry(1, 0); // unit r=1, scaled per instance

// Scratch objects for matrix stamping
const _sm   = new THREE.Matrix4();
const _sp   = new THREE.Vector3();
const _sq   = new THREE.Quaternion();
const _ss   = new THREE.Vector3();
const _sEul = new THREE.Euler();

type Props = { phase: GamePhase; characterPos: THREE.Vector3; onBeaconLit?: () => void };

export const SummitObjects = ({ phase, characterPos, onBeaconLit }: Props) => {
  const [pyreLit, setPyreLit] = useState(false);

  if (phase === "ascent") return null;

  return (
    <group>
      <BeaconPyre
        pyreLit={pyreLit}
        onLight={() => { setPyreLit(true); onBeaconLit?.(); }}
        characterPos={characterPos}
        phase={phase}
      />
      <SheraniSnowman characterPos={characterPos} />
      <SummitJournal characterPos={characterPos} />
      {pyreLit && <DistantBeacons />}
    </group>
  );
};

// ── Summit Beacon pyre ─────────────────────────────────────────────────────────

type PyreProps = {
  pyreLit: boolean;
  onLight: () => void;
  characterPos: THREE.Vector3;
  phase: GamePhase;
};

const BeaconPyre = ({ pyreLit, onLight, characterPos, phase }: PyreProps) => {
  const matcaps  = useMatcaps();
  const lightRef = useRef<THREE.PointLight>(null);
  const logRef   = useRef<THREE.InstancedMesh>(null!);
  const flameOpacity = useRef(0);
  const lightTarget  = useRef(0);
  const [showHint, setShowHint]   = useState(false);
  const [litFlash, setLitFlash]   = useState(false);
  const litRef = useRef(pyreLit);
  litRef.current = pyreLit;

  // Stamp 4 log matrices once at mount
  useEffect(() => {
    const m = logRef.current;
    if (!m) return;
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI;
      _sp.set(Math.cos(angle) * 0.45, 0.45, Math.sin(angle) * 0.45);
      _sEul.set(0, angle, Math.PI / 8);
      _sq.setFromEuler(_sEul);
      _ss.setScalar(1);
      _sm.compose(_sp, _sq, _ss);
      m.setMatrixAt(i, _sm);
    }
    m.instanceMatrix.needsUpdate = true;
  }, []);

  // Single useFrame: animate light + check proximity for hint
  useFrame(({ clock }, delta) => {
    if (!lightRef.current) return;

    if (pyreLit) {
      flameOpacity.current = Math.min(flameOpacity.current + 2.4 * delta, 1);
      lightTarget.current  = 8 + Math.sin(clock.getElapsedTime() * 5.7) * 1.5
                               + Math.sin(clock.getElapsedTime() * 11.3) * 0.8;
    } else {
      flameOpacity.current = Math.max(flameOpacity.current - 1.2 * delta, 0);
      lightTarget.current  = 0;
    }
    lightRef.current.intensity = THREE.MathUtils.lerp(
      lightRef.current.intensity,
      lightTarget.current,
      0.12
    );

    if (!litRef.current && phase === "summit") {
      const dx = characterPos.x - PYRE_POS[0];
      const dy = characterPos.y - PYRE_POS[1];
      const dz = characterPos.z - PYRE_POS[2];
      const near = Math.sqrt(dx * dx + dy * dy + dz * dz) < PYRE_INTERACT_RADIUS;
      setShowHint(near);
    }
  });

  // E / Enter key → light pyre when hint is showing
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement
      ) return;
      if (litRef.current) return;
      if (e.code === "KeyE" || e.code === "Enter") {
        if (showHint) {
          onLight();
          setLitFlash(true);
          setTimeout(() => setLitFlash(false), 3500);
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [showHint, onLight]);

  return (
    <group position={PYRE_POS}>
      {/* Stone fire-ring base */}
      <mesh position={[0, 0.15, 0]} receiveShadow>
        <cylinderGeometry args={[0.9, 1.0, 0.3, 10]} />
        <meshMatcapMaterial matcap={matcaps.stoneDark} />
      </mesh>
      {/* Stone cap ring — darker inner lip */}
      <mesh position={[0, 0.32, 0]}>
        <torusGeometry args={[0.7, 0.12, 6, 12]} />
        <meshMatcapMaterial matcap={matcaps.stoneDark} />
      </mesh>

      {/* Log ring — 4 logs → 1 draw call */}
      <instancedMesh ref={logRef} args={[LOG_GEO, undefined, 4]} castShadow>
        <meshMatcapMaterial matcap={matcaps.wood} />
      </instancedMesh>

      {/* Flame — only visible when lit */}
      {pyreLit && (
        <group position={[0, 0.5, 0]} scale={[1.8, 2.2, 1.8]}>
          <CampfireFlame />
        </group>
      )}

      {/* Unlit ember glow — very faint amber to hint it's there before lighting */}
      {!pyreLit && (
        <pointLight color="#c04010" intensity={0.35} distance={5} decay={2} />
      )}

      {/* Strong flickering point light — animates in when lit */}
      <pointLight
        ref={lightRef}
        position={[0, 2.5, 0]}
        color="#ff9020"
        intensity={0}
        distance={30}
        decay={2}
        castShadow
      />

      {/* Interaction hint */}
      {showHint && !pyreLit && (
        <Html
          position={[0, 3.2, 0]}
          center
          distanceFactor={10}
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
            letterSpacing: "0.07em",
            whiteSpace: "nowrap",
            backdropFilter: "blur(10px)",
          }}>
            {IS_TOUCH ? "Tap [E] to light" : "[E] Light the beacon"}
          </div>
        </Html>
      )}

      {/* Lit confirmation — brief flash on lighting */}
      {litFlash && (
        <Html
          position={[0, 3.2, 0]}
          center
          distanceFactor={10}
          style={{ pointerEvents: "none" }}
        >
          <div style={{
            background: "rgba(8,8,16,0.92)",
            border: "1px solid rgba(255,144,32,0.6)",
            borderRadius: "8px",
            padding: "7px 16px",
            fontFamily: "'DM Mono', monospace",
            fontSize: "11px",
            color: "#ff9020",
            letterSpacing: "0.07em",
            whiteSpace: "nowrap",
            backdropFilter: "blur(12px)",
            boxShadow: "0 0 16px rgba(255,144,32,0.2)",
            animation: "beaconFadeIn 0.3s ease both",
          }}>
            The beacon is lit.
          </div>
        </Html>
      )}
    </group>
  );
};

// ── Distant beacons — appear when pyre is lit ──────────────────────────────────
// Three distant glow points on the horizon, fading in over ~2 seconds.

const DISTANT_BEACON_POSITIONS: [number, number, number][] = [
  [-80, 30, -140],
  [ 55, 45, -120],
  [-20, 55, -160],
];

const DistantBeacons = () => {
  const opacity   = useRef(0);
  const meshRef   = useRef<THREE.InstancedMesh>(null!);
  const lightRefs = [
    useRef<THREE.PointLight>(null),
    useRef<THREE.PointLight>(null),
    useRef<THREE.PointLight>(null),
  ];

  // Stamp static beacon sphere matrices once at mount
  useEffect(() => {
    const m = meshRef.current;
    if (!m) return;
    DISTANT_BEACON_POSITIONS.forEach(([bx, by, bz], i) => {
      _sp.set(bx, by, bz);
      _sq.identity();
      _ss.setScalar(1);
      _sm.compose(_sp, _sq, _ss);
      m.setMatrixAt(i, _sm);
    });
    m.instanceMatrix.needsUpdate = true;
  }, []);

  useFrame(({ clock }, delta) => {
    opacity.current = Math.min(opacity.current + 0.5 * delta, 1);
    const flicker = 1 + Math.sin(clock.getElapsedTime() * 4.3) * 0.2;

    if (meshRef.current) {
      (meshRef.current.material as THREE.MeshBasicMaterial).opacity = opacity.current * 0.9;
    }
    for (let i = 0; i < 3; i++) {
      if (lightRefs[i].current) {
        lightRefs[i].current!.intensity = opacity.current * 6 * flicker;
      }
    }
  });

  return (
    <>
      {/* 3 beacon spheres → 1 draw call */}
      <instancedMesh ref={meshRef} args={[BEACON_GEO, undefined, 3]}>
        <meshBasicMaterial color="#ff8010" transparent opacity={0} />
      </instancedMesh>
      {/* Individual point lights — can't batch */}
      {DISTANT_BEACON_POSITIONS.map((pos, i) => (
        <pointLight
          key={i}
          ref={lightRefs[i]}
          position={pos}
          color="#ff9020"
          intensity={0}
          distance={60}
          decay={2}
        />
      ))}
    </>
  );
};

// ── Sherani Snowman ────────────────────────────────────────────────────────────
// Child-scaled snowman near the summit beacon. Named after Mo's daughter.
// On close approach: shows a thought-bubble.

const SNOWMAN_POS: [number, number, number] = [3.5, SUMMIT_Y, -1];
const SNOWMAN_TRIGGER_RADIUS = 2.8;
const SNOW_SHADOW = "#c8d8f0";

const SheraniSnowman = ({ characterPos }: { characterPos: THREE.Vector3 }) => {
  const matcaps = useMatcaps();
  const [bubble, setBubble] = useState(false);
  const suppressRef = useRef(false);
  const timerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);

  useFrame(() => {
    if (suppressRef.current) return;
    const dx = characterPos.x - SNOWMAN_POS[0];
    const dy = characterPos.y - SNOWMAN_POS[1];
    const dz = characterPos.z - SNOWMAN_POS[2];
    if (Math.sqrt(dx * dx + dy * dy + dz * dz) < SNOWMAN_TRIGGER_RADIUS) {
      suppressRef.current = true;
      setBubble(true);
      timerRef.current = setTimeout(() => setBubble(false), 5500);
    }
  });

  return (
    <group position={SNOWMAN_POS}>
      {bubble && (
        <Html
          position={[0, 2.2, 0]}
          center
          distanceFactor={8}
          style={{ pointerEvents: "none" }}
        >
          <div style={{
            background: "rgba(8,8,16,0.9)",
            border: "1px solid rgba(200,134,10,0.35)",
            borderRadius: "10px",
            padding: "8px 14px",
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: "12px",
            color: "rgba(250,248,244,0.88)",
            lineHeight: 1.55,
            backdropFilter: "blur(10px)",
            whiteSpace: "nowrap",
            animation: "beaconFadeIn 0.4s ease both",
            textAlign: "center",
          }}>
            One day we'll build<br />
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", color: "#C8860A" }}>
              something together, Sherani.
            </span>
          </div>
        </Html>
      )}
    <group position={[0, 0, 0]} scale={[0.65, 0.65, 0.65]}>
      {/* Bottom body */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <sphereGeometry args={[0.55, 12, 12]} />
        <meshMatcapMaterial matcap={matcaps.snow} />
      </mesh>
      {/* Middle body */}
      <mesh position={[0, 1.28, 0]} castShadow>
        <sphereGeometry args={[0.40, 12, 12]} />
        <meshMatcapMaterial matcap={matcaps.snow} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 1.92, 0]} castShadow>
        <sphereGeometry args={[0.28, 12, 12]} />
        <meshMatcapMaterial matcap={matcaps.snow} />
      </mesh>
      {/* Eyes */}
      {[-0.08, 0.08].map((x, idx) => (
        <mesh key={idx} position={[x, 1.98, 0.26]} castShadow>
          <sphereGeometry args={[0.035, 8, 8]} />
          <meshBasicMaterial color="#1a1a2e" />
        </mesh>
      ))}
      {/* Carrot nose */}
      <mesh position={[0, 1.93, 0.3]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <coneGeometry args={[0.035, 0.14, 8]} />
        <meshBasicMaterial color="#e07020" />
      </mesh>
      {/* Scarf — amber to match brand */}
      <mesh position={[0, 1.67, 0]}>
        <torusGeometry args={[0.30, 0.055, 8, 20]} />
        <meshBasicMaterial color="#C8860A" />
      </mesh>
      {/* Arms — two sticks */}
      {[-1, 1].map((side, idx) => (
        <mesh
          key={idx}
          position={[side * 0.42, 1.38, 0]}
          rotation={[0, 0, side * -0.55]}
          castShadow
        >
          <cylinderGeometry args={[0.025, 0.018, 0.55, 5]} />
          <meshMatcapMaterial matcap={matcaps.wood} />
        </mesh>
      ))}
      {/* Snow shadow disc */}
      <mesh position={[0, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.55, 16]} />
        <meshBasicMaterial color={SNOW_SHADOW} transparent opacity={0.35} depthWrite={false} />
      </mesh>
    </group>
    </group>
  );
};

// ── Summit Journal — cairn with a personal note ────────────────────────────────
// A small stack of stones on the plateau. Approached within 3 units → shows
// a brief personal message from Mo. Suppressed after first read.

const JOURNAL_POS: [number, number, number] = [-7, SUMMIT_Y, 5];
const JOURNAL_RADIUS = 3.0;

// Cairn stones: 2 stoneDark + 2 stoneLight → 2 InstancedMesh
const CAIRN_DARK: Array<[number, number, number, number]> = [
  [0,    0.18, 0,     0.35],
  [0.06, 0.55, 0.03,  0.26],
];
const CAIRN_LIGHT: Array<[number, number, number, number]> = [
  [-0.04, 0.84, -0.02, 0.19],
  [ 0.05, 1.08,  0.04, 0.12],
];

const SummitJournal = ({ characterPos }: { characterPos: THREE.Vector3 }) => {
  const matcaps  = useMatcaps();
  const darkRef  = useRef<THREE.InstancedMesh>(null!);
  const lightRef2 = useRef<THREE.InstancedMesh>(null!);
  const [open, setOpen] = useState(false);
  const seenRef  = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const stamp = (m: THREE.InstancedMesh, defs: Array<[number, number, number, number]>) => {
      if (!m) return;
      defs.forEach(([x, y, z, r], i) => {
        _sp.set(x, y, z);
        _sq.identity();
        _ss.setScalar(r);
        _sm.compose(_sp, _sq, _ss);
        m.setMatrixAt(i, _sm);
      });
      m.instanceMatrix.needsUpdate = true;
    };
    stamp(darkRef.current, CAIRN_DARK);
    stamp(lightRef2.current, CAIRN_LIGHT);
  }, []);

  useFrame(() => {
    if (seenRef.current) return;
    const dx = characterPos.x - JOURNAL_POS[0];
    const dy = characterPos.y - JOURNAL_POS[1];
    const dz = characterPos.z - JOURNAL_POS[2];
    if (Math.sqrt(dx * dx + dy * dy + dz * dz) < JOURNAL_RADIUS) {
      seenRef.current = true;
      setOpen(true);
      timerRef.current = setTimeout(() => setOpen(false), 8000);
    }
  });

  return (
    <group position={JOURNAL_POS}>
      {/* Cairn — 4 stacked stones → 2 draw calls (by matcap) */}
      <instancedMesh ref={darkRef} args={[CAIRN_GEO, undefined, 2]} castShadow>
        <meshMatcapMaterial matcap={matcaps.stoneDark} />
      </instancedMesh>
      <instancedMesh ref={lightRef2} args={[CAIRN_GEO, undefined, 2]} castShadow>
        <meshMatcapMaterial matcap={matcaps.stoneLight} />
      </instancedMesh>
      {/* Very faint amber warmth — barely visible, suggests something lived-in */}
      <pointLight position={[0, 0.8, 0.4]} color="#C8860A" intensity={0.35} distance={5} decay={2} />

      {/* Journal note — appears on approach */}
      {open && (
        <Html
          position={[0, 2.0, 0]}
          center
          distanceFactor={9}
          style={{ pointerEvents: "none" }}
        >
          <div style={{
            background: "rgba(6,6,14,0.92)",
            border: "1px solid rgba(200,134,10,0.3)",
            borderRadius: "10px",
            padding: "12px 16px",
            fontFamily: "'Inter', system-ui, sans-serif",
            fontSize: "12px",
            color: "rgba(250,248,244,0.85)",
            lineHeight: 1.65,
            backdropFilter: "blur(12px)",
            maxWidth: "220px",
            textAlign: "center",
            animation: "beaconFadeIn 0.5s ease both",
          }}>
            If you made it here,<br />
            you climbed.<br />
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", color: "#C8860A", display: "block", marginTop: "8px" }}>
              So did I.
            </span>
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "10px", color: "rgba(250,248,244,0.38)", display: "block", marginTop: "4px" }}>
              — Manu
            </span>
          </div>
        </Html>
      )}
    </group>
  );
};
