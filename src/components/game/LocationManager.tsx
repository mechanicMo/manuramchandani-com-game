// src/components/game/LocationManager.tsx
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { LOCATIONS, type Location } from "@/data/locations";
import type { GamePhase } from "@/hooks/useGamePhase";

type Props = {
  characterPos: THREE.Vector3;
  phase: GamePhase;
  onLocationChange: (loc: Location | null) => void;
};

export const LocationManager = ({ characterPos, phase, onLocationChange }: Props) => {
  const activeIdRef = useRef<string | null>(null);

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
      activeIdRef.current = foundId;
      onLocationChange(found);
    }
  });

  return null;
};
