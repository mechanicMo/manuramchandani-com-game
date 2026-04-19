// src/components/game/World.tsx
import { useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Physics, RigidBody, CuboidCollider } from "@react-three/rapier";
import { Sky, Stars } from "@react-three/drei";
import { useKeyboardControls } from "@react-three/drei";
import * as THREE from "three";
import { Character }           from "./Character";
import { CameraRig }           from "./CameraRig";
import { Mountain }            from "./Mountain";
import { HoldMarkers, HOLDS }  from "./HoldMarkers";
import { ChossSystem }         from "./ChossSystem";
import { DustParticles }       from "./DustParticles";
import { SummitLedge }         from "./SummitLedge";
import { SnowParticles }       from "./SnowParticles";
import { GroundTerrain }       from "./GroundTerrain";
import { ForestBase }          from "./ForestBase";
import { BoulderField }        from "./BoulderField";
import { ClimbingDetail }      from "./ClimbingDetail";
import { LocationManager }     from "./LocationManager";
import { LocationVisuals }     from "./LocationVisuals";
import { useSkyTransition }    from "@/hooks/useSkyTransition";
import { useAudioManager }     from "@/hooks/useAudioManager";
import type { useGamePhase }   from "@/hooks/useGamePhase";
import type { Location }       from "@/data/locations";

type Props = {
  gamePhase: ReturnType<typeof useGamePhase>;
  onLocationChange: (loc: Location | null) => void;
  audio: ReturnType<typeof useAudioManager>;
  muted: boolean;
};

export const World = ({ gamePhase, onLocationChange, audio, muted }: Props) => {
  const [pos, setPos]                        = useState(() => new THREE.Vector3());
  const [characterHeading, setCharacterHeading] = useState(0);
  const mountainSceneRef                      = useRef<THREE.Object3D | null>(null);
  const velocityRef                          = useRef({ x: 0, y: 0 });
  const prevPosRef                           = useRef(new THREE.Vector3());
  const { phase, onCharacterY, beginDescent } = gamePhase;
  const sky                                  = useSkyTransition(phase);
  const spacePressed                         = useKeyboardControls((s: Record<string, boolean>) => s.jump);
  const spaceWasDown                         = useRef(false);
  const ambientLightRef                      = useRef<THREE.Light>(null);

  // Start ambient wind loops once (audio buffers may not be ready yet — setLoopVolume handles gracefully)
  useEffect(() => {
    if (muted) return;
    audio.loop("wind-low", 0.5);
    audio.loop("wind-high", 0.0);
    return () => {
      audio.stopAllLoops();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [muted]);

  // Phase-based audio triggers
  useEffect(() => {
    if (muted) return;
    if (phase === "summit") {
      audio.play("summit-arrive", 0.8);
    }
    if (phase === "descent") {
      audio.loop("snowboard", 0.0); // starts silent; volume set in useFrame by lateral velocity
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, muted]);

  // Summit -> descent trigger: SPACE while in summit phase
  if (spacePressed && !spaceWasDown.current && phase === "summit") {
    beginDescent();
  }
  spaceWasDown.current = spacePressed;

  useFrame(() => {
    if (ambientLightRef.current) {
      ambientLightRef.current.intensity = sky.ambientIntensity;
      (ambientLightRef.current as THREE.Light).color.setStyle(sky.ambientColor);
    }

    if (!muted) {
      // Elevation-based wind volumes
      const y = pos.y;
      const highVol = Math.min(y / 80, 1.0) * 0.7;
      const lowVol  = (1.0 - Math.min(y / 80, 1.0)) * 0.5;
      audio.setLoopVolume("wind-low", lowVol);
      audio.setLoopVolume("wind-high", highVol);

      // Snowboard carve — loop during descent, volume relative to lateral velocity
      if (phase === "descent") {
        const lateralSpeed = Math.abs(velocityRef.current.x);
        const snowVol = Math.min(lateralSpeed * 2, 1.0) * 0.5;
        audio.setLoopVolume("snowboard", snowVol);
      }
    }
  });

  const handlePositionChange = (p: THREE.Vector3) => {
    velocityRef.current = { x: p.x - prevPosRef.current.x, y: p.y - prevPosRef.current.y };
    prevPosRef.current.copy(p);
    setPos(p.clone());
    onCharacterY(p.y);
  };

  return (
    <>
      <fogExp2 attach="fog" args={[sky.fogColor, sky.fogDensity]} />

      {/* Ambient — night is deep blue-black, not grey */}
      <ambientLight ref={ambientLightRef} intensity={sky.ambientIntensity} color={sky.ambientColor} />

      {/* Key light — warm, from lower-left (campfire direction) */}
      <directionalLight
        position={[-6, 8, 6]}
        intensity={1.8}
        color="#ffd4a0"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={0.5}
        shadow-camera-far={200}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={100}
        shadow-camera-bottom={-5}
      />

      {/* Sky fill — cool blue, opposite side */}
      <directionalLight position={[8, 20, -4]} intensity={0.6} color="#a8c8f0" />

      {/* Rim light — behind cliff, separates character from rock */}
      <directionalLight position={[0, 5, -8]} intensity={0.8} color="#c0d8f8" />

      <Sky
        distance={450000}
        sunPosition={sky.sunPosition}
        inclination={0.49}
        azimuth={0.25}
        rayleigh={sky.rayleigh}
        turbidity={sky.turbidity}
      />
      {phase === "ascent" && <Stars radius={80} depth={50} count={7000} factor={5.5} saturation={0} fade speed={0.5} />}
      {phase === "ascent" && (
        <mesh position={[-22, 88, -65]}>
          <sphereGeometry args={[1.4, 12, 8]} />
          <meshBasicMaterial color="#d8e8ff" />
        </mesh>
      )}

      <Physics gravity={[0, -9.81, 0]}>
        {/* Big ground plane so character has walkable terrain around the mountain */}
        <RigidBody type="fixed" colliders={false}>
          <CuboidCollider args={[200, 0.5, 200]} position={[0, -0.5, 0]} />
        </RigidBody>
        <Mountain onSceneReady={(s) => { mountainSceneRef.current = s; }} />
        <HoldMarkers characterPos={pos} />
        <ChossSystem characterPos={pos} velocityRef={velocityRef} />
        <Character onPositionChange={handlePositionChange} onHeadingChange={setCharacterHeading} holds={HOLDS} gamePhase={phase} audio={audio} muted={muted} mountainScene={mountainSceneRef.current} />
      </Physics>

      <SummitLedge phase={phase} />
      <DustParticles characterPos={pos} />
      <SnowParticles characterPos={pos} phase={phase} />
      <GroundTerrain phase={phase} />
      <ForestBase phase={phase} />
      <BoulderField phase={phase} />
      <ClimbingDetail phase={phase} />
      <LocationVisuals phase={phase} />
      <LocationManager characterPos={pos} phase={phase} onLocationChange={onLocationChange} audio={audio} muted={muted} />
      <CameraRig target={pos} phase={phase} characterHeading={characterHeading} mountainScene={mountainSceneRef.current} />
    </>
  );
};
