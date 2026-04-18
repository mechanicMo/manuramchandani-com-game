// src/components/game/World.tsx
import { useRef, useState } from "react";
import { Physics } from "@react-three/rapier";
import { Sky, Stars } from "@react-three/drei";
import * as THREE from "three";
import { Character }          from "./Character";
import { CameraRig }          from "./CameraRig";
import { CliffFace }          from "./CliffFace";
import { HoldMarkers, HOLDS } from "./HoldMarkers";
import { ChossSystem }        from "./ChossSystem";
import { DustParticles }      from "./DustParticles";
import type { useGamePhase }  from "@/hooks/useGamePhase";

type Props = { gamePhase: ReturnType<typeof useGamePhase> };

export const World = ({ gamePhase }: Props) => {
  const [pos, setPos]           = useState(() => new THREE.Vector3());
  const velocityRef             = useRef({ x: 0, y: 0 });
  const prevPosRef              = useRef(new THREE.Vector3());
  const { phase, onCharacterY } = gamePhase;

  const handlePositionChange = (p: THREE.Vector3) => {
    velocityRef.current = { x: p.x - prevPosRef.current.x, y: p.y - prevPosRef.current.y };
    prevPosRef.current.copy(p);
    setPos(p.clone());
    onCharacterY(p.y);
  };

  return (
    <>
      <fog attach="fog" args={["#06091A", 25, 70]} />

      <ambientLight intensity={0.25} color="#2a3a5a" />
      <directionalLight
        position={[-8, 30, 8]}
        intensity={1.4}
        color="#b0c4de"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <directionalLight position={[6, 10, 4]} intensity={0.15} color="#3a2810" />

      <Sky distance={450000} sunPosition={[0, 0.02, -1]} inclination={0.49} azimuth={0.25} rayleigh={8} turbidity={12} />
      <Stars radius={80} depth={50} count={4000} factor={4} saturation={0} fade />

      <Physics gravity={[0, -9.81, 0]}>
        <CliffFace />
        <HoldMarkers characterPos={pos} />
        <ChossSystem characterPos={pos} velocityRef={velocityRef} />
        <Character onPositionChange={handlePositionChange} holds={HOLDS} />
      </Physics>

      <DustParticles characterPos={pos} />
      <CameraRig target={pos} phase={phase} />
    </>
  );
};
