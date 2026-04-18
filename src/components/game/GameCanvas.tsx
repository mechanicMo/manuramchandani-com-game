// src/components/game/GameCanvas.tsx
import { Suspense, useState, useCallback, useRef } from "react";
import { Canvas }            from "@react-three/fiber";
import { KeyboardControls }  from "@react-three/drei";
import * as THREE            from "three";
import { World }             from "./World";
import { LoadingScreen }     from "@/components/ui/LoadingScreen";
import { KeyHints }          from "@/components/ui/KeyHints";
import { LocationOverlay }   from "@/components/ui/LocationOverlay";
import { useGamePhase }      from "@/hooks/useGamePhase";
import type { Location }     from "@/data/locations";

const KEY_MAP = [
  { name: "up",       keys: ["ArrowUp",    "KeyW"] },
  { name: "down",     keys: ["ArrowDown",  "KeyS"] },
  { name: "left",     keys: ["ArrowLeft",  "KeyA"] },
  { name: "right",    keys: ["ArrowRight", "KeyD"] },
  { name: "jump",     keys: ["Space"] },
  { name: "interact", keys: ["Enter"] },
];

export const GameCanvas = () => {
  const [loading, setLoading]               = useState(true);
  const [activeLocation, setActiveLocation] = useState<Location | null>(null);
  const [nearbyName, setNearbyName]         = useState<string | null>(null);
  const gamePhase                           = useGamePhase();
  const nearbyRef                           = useRef<Location | null>(null);

  // LocationManager fires this whenever proximity changes
  const handleLocationChange = useCallback((loc: Location | null) => {
    nearbyRef.current = loc;

    // Gate, vignette, view: auto-display on proximity
    if (loc && (loc.interactionType === "gate" || loc.interactionType === "vignette" || loc.interactionType === "view")) {
      setActiveLocation(loc);
    }
    // Panel / contact: open only on Enter key press (handled below)
    // When leaving proximity, close any open panel for this location
    if (!loc) {
      setActiveLocation(prev => {
        if (prev && (prev.interactionType === "panel" || prev.interactionType === "contact")) {
          return null;
        }
        return prev;
      });
    }

    // Update nearbyName for KeyHints
    setNearbyName(loc ? loc.name : null);
  }, []);

  // Enter key opens panel for nearby panel/contact locations
  const handleInteractKey = useCallback(() => {
    const nearby = nearbyRef.current;
    if (!nearby) return;
    if (nearby.interactionType === "panel" || nearby.interactionType === "contact") {
      setActiveLocation(prev => prev?.id === nearby.id ? null : nearby);
    }
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      <LoadingScreen loading={loading} />
      <KeyHints phase={gamePhase.phase} nearbyName={nearbyName} />
      <LocationOverlay location={activeLocation} onDismiss={() => setActiveLocation(null)} />

      <KeyboardControls map={KEY_MAP}>
        <Canvas
          shadows
          camera={{ fov: 60, near: 0.1, far: 1000, position: [1.5, 4, 8] }}
          gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
          onCreated={() => setLoading(false)}
        >
          <Suspense fallback={null}>
            <World gamePhase={gamePhase} onLocationChange={handleLocationChange} />
          </Suspense>
        </Canvas>
      </KeyboardControls>

      {/* Fallback for Enter key outside Canvas */}
      <KeyboardInterceptor onEnter={handleInteractKey} />
    </div>
  );
};

// Fallback component to capture Enter key outside Canvas
const KeyboardInterceptor = ({ onEnter }: { onEnter: () => void }) => {
  useState(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === "Enter") onEnter();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  return null;
};
