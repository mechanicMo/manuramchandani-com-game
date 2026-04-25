// src/components/game/GameCanvas.tsx
import { Suspense, useState, useCallback, useRef, useEffect } from "react";
import { Canvas }            from "@react-three/fiber";
import { KeyboardControls }  from "@react-three/drei";
import * as THREE            from "three";
import { EffectComposer, Bloom, Vignette, ToneMapping, SSAO } from "@react-three/postprocessing";
import { ToneMappingMode }   from "postprocessing";
import { World }             from "./World";
import { LoadingScreen }     from "@/components/ui/LoadingScreen";
import { KeyHints }          from "@/components/ui/KeyHints";
import { LocationOverlay }   from "@/components/ui/LocationOverlay";
import { ChatAvatar }        from "@/components/ui/ChatAvatar";
import { useGamePhase }      from "@/hooks/useGamePhase";
import { useAudioManager }   from "@/hooks/useAudioManager";
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
  const [muted, setMuted]                   = useState(false);
  const [climbing, setClimbing]             = useState(false);
  const gamePhase                           = useGamePhase();
  const nearbyRef                           = useRef<Location | null>(null);
  const audio                               = useAudioManager();

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

  const handleMute = useCallback(() => {
    if (!muted) {
      audio.stopAllLoops();
    }
    setMuted(prev => !prev);
  }, [muted, audio]);

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      <LoadingScreen loading={loading} />
      <KeyHints phase={gamePhase.phase} nearbyName={nearbyName} climbing={climbing} />
      <LocationOverlay location={activeLocation} onDismiss={() => setActiveLocation(null)} audio={audio} muted={muted} />
      <ChatAvatar phase={gamePhase.phase} />
      <AudioLoader audio={audio} />

      {/* Mute toggle — top-right corner */}
      <button
        onClick={handleMute}
        title={muted ? "Unmute" : "Mute"}
        style={{
          position: "fixed",
          top: "16px",
          right: "16px",
          zIndex: 300,
          background: "rgba(10,10,20,0.6)",
          border: "1px solid rgba(200,134,10,0.4)",
          borderRadius: "6px",
          padding: "8px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backdropFilter: "blur(4px)",
        }}
      >
        {muted ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FAF8F4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <line x1="23" y1="9" x2="17" y2="15" />
            <line x1="17" y1="9" x2="23" y2="15" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FAF8F4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          </svg>
        )}
      </button>

      <KeyboardControls map={KEY_MAP}>
        <Canvas
          shadows
          camera={{ fov: 60, near: 0.1, far: 1000, position: [1.5, 4, 8] }}
          gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
          onCreated={() => setLoading(false)}
        >
          <Suspense fallback={null}>
            <World gamePhase={gamePhase} onLocationChange={handleLocationChange} onClimbStateChange={setClimbing} audio={audio} muted={muted} />
          </Suspense>
          <EffectComposer enableNormalPass>
            <SSAO
              radius={0.05}
              intensity={20}
              luminanceInfluence={0.6}
              color="black"
            />
            <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
            <Bloom intensity={0.4} luminanceThreshold={0.6} luminanceSmoothing={0.9} />
            <Vignette offset={0.4} darkness={0.5} />
          </EffectComposer>
        </Canvas>
      </KeyboardControls>

      {/* Fallback for Enter key outside Canvas */}
      <KeyboardInterceptor onEnter={handleInteractKey} />
    </div>
  );
};

// Fallback component to capture Enter key outside Canvas
const KeyboardInterceptor = ({ onEnter }: { onEnter: () => void }) => {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === "Enter") onEnter();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onEnter]);

  return null;
};

// Preloads all audio files on first user interaction (browser autoplay policy)
const AudioLoader = ({ audio }: { audio: ReturnType<typeof useAudioManager> }) => {
  const loaded = useRef(false);

  useEffect(() => {
    const onInteract = () => {
      if (loaded.current) return;
      loaded.current = true;
      audio.unlock();
      const files: [string, string][] = [
        ["wind-low",       "/audio/wind-low.mp3"],
        ["wind-high",      "/audio/wind-high.mp3"],
        ["fire-crackle",   "/audio/fire-crackle.mp3"],
        ["keyboard",       "/audio/keyboard.mp3"],
        ["hold-grab-1",    "/audio/hold-grab-1.mp3"],
        ["hold-grab-2",    "/audio/hold-grab-2.mp3"],
        ["hold-grab-3",    "/audio/hold-grab-3.mp3"],
        ["hold-grab-4",    "/audio/hold-grab-4.mp3"],
        ["summit-arrive",  "/audio/summit-arrive.mp3"],
        ["snowboard",      "/audio/snowboard-carve.mp3"],
        ["panel-open",     "/audio/panel-open.mp3"],
        ["panel-close",    "/audio/panel-close.mp3"],
      ];
      files.forEach(([key, url]) => audio.load(key, url));
    };
    window.addEventListener("click", onInteract, { once: true });
    window.addEventListener("keydown", onInteract, { once: true });
    return () => {
      window.removeEventListener("click", onInteract);
      window.removeEventListener("keydown", onInteract);
    };
  }, [audio]);

  return null;
};
