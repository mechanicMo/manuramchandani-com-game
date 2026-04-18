import { Suspense, useState } from "react";
import { Canvas }            from "@react-three/fiber";
import { KeyboardControls }  from "@react-three/drei";
import * as THREE            from "three";
import { World }             from "./World";
import { LoadingScreen }     from "@/components/ui/LoadingScreen";
import { KeyHints }          from "@/components/ui/KeyHints";
import { useGamePhase }      from "@/hooks/useGamePhase";

const KEY_MAP = [
  { name: "up",       keys: ["ArrowUp",    "KeyW"] },
  { name: "down",     keys: ["ArrowDown",  "KeyS"] },
  { name: "left",     keys: ["ArrowLeft",  "KeyA"] },
  { name: "right",    keys: ["ArrowRight", "KeyD"] },
  { name: "jump",     keys: ["Space"] },
  { name: "interact", keys: ["Enter"] },
];

export const GameCanvas = () => {
  const [loading, setLoading] = useState(true);
  const gamePhase = useGamePhase();

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
      <LoadingScreen loading={loading} />
      <KeyHints phase={gamePhase.phase} />

      <KeyboardControls map={KEY_MAP}>
        <Canvas
          shadows
          camera={{ fov: 60, near: 0.1, far: 1000, position: [1.5, 4, 8] }}
          gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
          onCreated={() => setLoading(false)}
        >
          <Suspense fallback={null}>
            <World gamePhase={gamePhase} />
          </Suspense>
        </Canvas>
      </KeyboardControls>
    </div>
  );
};
