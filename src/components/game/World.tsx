import { useRef, useState } from "react";
import { Sky, Stars, Grid } from "@react-three/drei";
import * as THREE from "three";
import { Character }  from "./Character";
import { CameraRig }  from "./CameraRig";
import type { useGamePhase } from "@/hooks/useGamePhase";

type Props = {
  gamePhase: ReturnType<typeof useGamePhase>;
};

export const World = ({ gamePhase }: Props) => {
  const charPos = useRef(new THREE.Vector3());
  const [pos, setPos] = useState(() => new THREE.Vector3());
  const { phase, onCharacterY } = gamePhase;

  const handlePositionChange = (p: THREE.Vector3) => {
    charPos.current.copy(p);
    setPos(p.clone());
    onCharacterY(p.y);
  };

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[5, 20, 5]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <directionalLight position={[-5, 10, -5]} intensity={0.3} color="#4466AA" />

      <Sky
        distance={450000}
        sunPosition={[0, 0.05, -1]}
        inclination={0.49}
        azimuth={0.25}
        rayleigh={6}
        turbidity={10}
      />
      <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade />

      <Grid
        position={[0, -0.01, 0]}
        args={[20, 20]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#1a2040"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#2a3060"
        fadeDistance={30}
        infiniteGrid
      />

      <Character onPositionChange={handlePositionChange} />
      <CameraRig target={pos} phase={phase} />
    </>
  );
};
