// src/components/game/LocationManager.tsx
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { LOCATIONS, type Location } from "@/data/locations";
import type { GamePhase } from "@/hooks/useGamePhase";
import type { useAudioManager } from "@/hooks/useAudioManager";

type Props = {
  characterPos: THREE.Vector3;
  phase: GamePhase;
  onLocationChange: (loc: Location | null) => void;
  audio: ReturnType<typeof useAudioManager>;
  muted: boolean;
};

// Location-specific ambient sound keys
const LOCATION_SOUNDS: Record<string, { key: string; volume: number }> = {
  "base-camp":   { key: "fire-crackle", volume: 0.4 },
  "agent-cave":  { key: "keyboard",     volume: 0.25 },
};

export const LocationManager = ({ characterPos, phase, onLocationChange, audio, muted }: Props) => {
  const activeIdRef    = useRef<string | null>(null);
  const activeSoundRef = useRef<string | null>(null);

  useFrame(() => {
    if (!characterPos) return;
    // Only check locations matching current phase
    const candidates = LOCATIONS.filter(loc => loc.phase === phase);

    let found: Location | null = null;
    for (const loc of candidates) {
      const dist = Math.abs(characterPos.y - loc.y);
      if (dist < loc.proximityRadius) {
        found = loc;
        break;
      }
    }

    const foundId = found?.id ?? null;
    if (foundId !== activeIdRef.current) {
      // Stop any previously playing location sound
      if (activeSoundRef.current) {
        const prev = LOCATION_SOUNDS[activeIdRef.current ?? ""];
        if (prev) {
          audio.setLoopVolume(prev.key, 0);
          // Fade out by setting volume to 0; actual stop handled on next location or mute
        }
        activeSoundRef.current = null;
      }

      activeIdRef.current = foundId;
      onLocationChange(found);

      // Start location ambient if applicable
      if (found && !muted) {
        const soundDef = LOCATION_SOUNDS[found.id];
        if (soundDef) {
          audio.loop(soundDef.key, soundDef.volume);
          activeSoundRef.current = soundDef.key;
        }
      }
    }
  });

  return null;
};
