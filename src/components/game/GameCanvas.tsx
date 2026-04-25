// src/components/game/GameCanvas.tsx
import { Suspense, useState, useCallback, useRef, useEffect } from "react";
import { Canvas }            from "@react-three/fiber";
import { KeyboardControls }  from "@react-three/drei";
import * as THREE            from "three";
import { EffectComposer, Bloom, Vignette, ToneMapping } from "@react-three/postprocessing";
import { ToneMappingMode }   from "postprocessing";
import { World }             from "./World";
import { LoadingScreen }     from "@/components/ui/LoadingScreen";
import { KeyHints }          from "@/components/ui/KeyHints";
import { LocationOverlay }   from "@/components/ui/LocationOverlay";
import { SummitOverlay }     from "@/components/ui/SummitOverlay";
import { DescentOverlay }    from "@/components/ui/DescentOverlay";
import { ChatAvatar }        from "@/components/ui/ChatAvatar";
import { ShortcutsHelp }     from "@/components/ui/ShortcutsHelp";
import { VirtualJoystick }   from "@/components/ui/VirtualJoystick";
import { useGamePhase }      from "@/hooks/useGamePhase";
import { useAudioManager }   from "@/hooks/useAudioManager";
import { useDeviceQuality }  from "@/hooks/useDeviceQuality";
import type { Location }     from "@/data/locations";

const KEY_MAP = [
  { name: "up",       keys: ["ArrowUp",    "KeyW"] },
  { name: "down",     keys: ["ArrowDown",  "KeyS"] },
  { name: "left",     keys: ["ArrowLeft",  "KeyA"] },
  { name: "right",    keys: ["ArrowRight", "KeyD"] },
  { name: "jump",     keys: ["Space"] },
  { name: "interact", keys: ["Enter", "KeyE"] },
];

const isTouchDevice = () => "ontouchstart" in window || navigator.maxTouchPoints > 0;

export const GameCanvas = () => {
  const [loading, setLoading]               = useState(true);
  const [activeLocation, setActiveLocation] = useState<Location | null>(null);
  const [nearbyName, setNearbyName]         = useState<string | null>(null);
  const [muted, setMuted]                   = useState(false);
  const [climbing, setClimbing]             = useState(false);
  const [chatOpen, setChatOpen]             = useState(false);
  const [helpOpen, setHelpOpen]             = useState(false);
  const [openedByBeacon, setOpenedByBeacon] = useState(false);
  const gamePhase                           = useGamePhase();
  const nearbyRef                           = useRef<Location | null>(null);
  const audio                               = useAudioManager();
  const quality                             = useDeviceQuality();
  const maxDpr = quality === "low" ? 1 : quality === "medium" ? 1.5 : Math.min(window.devicePixelRatio, 2);

  const handleMute = useCallback(() => {
    if (!muted) {
      audio.stopAllLoops();
    }
    setMuted(prev => !prev);
  }, [muted, audio]);

  // C / ? / ESC global key shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement
      ) return;

      if (e.key === "?") {
        setHelpOpen(prev => !prev);
      }
      if (e.key === "c" || e.key === "C") {
        setOpenedByBeacon(false);
        setChatOpen(prev => !prev);
      }
      if (e.key === "Escape") {
        setChatOpen(false);
        setHelpOpen(false);
      }
      if (e.key === "m" || e.key === "M") {
        handleMute();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleMute]);

  const handleLocationChange = useCallback((loc: Location | null) => {
    nearbyRef.current = loc;

    // Vignette, view, marker, kiosk: auto-display on proximity
    if (loc && (loc.interactionType === "vignette" || loc.interactionType === "view" || loc.interactionType === "marker" || loc.interactionType === "kiosk")) {
      setActiveLocation(loc);
    }
    // When leaving proximity, close any open panel for this location
    if (!loc) {
      setActiveLocation(prev => {
        if (prev && (prev.interactionType === "panel" || prev.interactionType === "contact" || prev.interactionType === "kiosk")) {
          return null;
        }
        return prev;
      });
    }

    // Only show [Enter] hint for types requiring explicit interaction (kiosk auto-shows, no hint needed)
    setNearbyName(loc && (loc.interactionType === "panel" || loc.interactionType === "contact") ? loc.name : null);
  }, []);

  const handleInteractKey = useCallback(() => {
    const nearby = nearbyRef.current;
    if (!nearby) return;
    if (nearby.interactionType === "panel" || nearby.interactionType === "contact") {
      setActiveLocation(prev => prev?.id === nearby.id ? null : nearby);
    }
  }, []);

  const handleRequestOpenChat = useCallback(() => {
    setOpenedByBeacon(true);
    setChatOpen(true);
  }, []);

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      <LoadingScreen loading={loading} />
      <KeyHints phase={gamePhase.phase} nearbyName={nearbyName} climbing={climbing} summitArriving={gamePhase.summitArriving} />
      <SummitOverlay phase={gamePhase.phase} />
      <DescentOverlay phase={gamePhase.phase} />
      <LocationOverlay location={activeLocation} onDismiss={() => setActiveLocation(null)} audio={audio} muted={muted} onBeginDescent={gamePhase.beginDescent} />
      <ChatAvatar
        phase={gamePhase.phase}
        open={chatOpen}
        onClose={() => { setChatOpen(false); setOpenedByBeacon(false); }}
        openedByBeacon={openedByBeacon}
      />
      <ShortcutsHelp open={helpOpen} onClose={() => setHelpOpen(false)} />
      <VirtualJoystick
        nearbyName={nearbyName}
        onInteract={handleInteractKey}
        onOpenChat={handleRequestOpenChat}
      />
      <AudioLoader audio={audio} />

      {/* Help button — top-left (keyboard-only, hidden on touch devices) */}
      {!isTouchDevice() && <button
        onClick={() => setHelpOpen(true)}
        style={{
          position: "fixed",
          top: "20px",
          left: "20px",
          background: "rgba(8,8,16,0.65)",
          border: "1px solid rgba(200,134,10,0.25)",
          borderRadius: "6px",
          color: "rgba(200,134,10,0.75)",
          fontFamily: "'DM Mono', monospace",
          fontSize: "11px",
          padding: "5px 9px",
          cursor: "pointer",
          zIndex: 100,
          backdropFilter: "blur(8px)",
          letterSpacing: "0.06em",
        }}
      >
        (?)
      </button>}

      {/* Mute toggle — top-right */}
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
          shadows={{ type: THREE.PCFShadowMap }}
          dpr={[1, maxDpr]}
          camera={{ fov: 60, near: 0.1, far: 1000, position: [1.5, 4, 8] }}
          gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
          onCreated={() => setLoading(false)}
        >
          <Suspense fallback={null}>
            <World
              gamePhase={gamePhase}
              onLocationChange={handleLocationChange}
              onClimbStateChange={setClimbing}
              onRequestOpenChat={handleRequestOpenChat}
              audio={audio}
              muted={muted}
            />
          </Suspense>
          <EffectComposer>
            <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
            {quality !== "low" && (
              <Bloom
                intensity={0.35}
                luminanceThreshold={0.55}
                luminanceSmoothing={0.85}
              />
            )}
            {quality !== "low" && <Vignette offset={0.4} darkness={0.5} />}
          </EffectComposer>
        </Canvas>
      </KeyboardControls>

      <KeyboardInterceptor onEnter={handleInteractKey} />
    </div>
  );
};

const KeyboardInterceptor = ({ onEnter }: { onEnter: () => void }) => {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === "Enter" || e.code === "KeyE") onEnter();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onEnter]);

  return null;
};

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
