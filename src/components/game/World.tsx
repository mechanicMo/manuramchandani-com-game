// src/components/game/World.tsx
import { useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Physics, RigidBody, CuboidCollider } from "@react-three/rapier";
import { Sky } from "@react-three/drei";
import { useKeyboardControls } from "@react-three/drei";
import * as THREE from "three";
import { Character }           from "./Character";
import { CameraRig }           from "./CameraRig";
import { Mountain }            from "./Mountain";
import { HoldMarkers, HOLDS }  from "./HoldMarkers";
import { ChossSystem }         from "./ChossSystem";
import { DustParticles }       from "./DustParticles";
import { SummitLedge }         from "./SummitLedge";
import { SummitObjects }       from "./SummitObjects";
import { SnowParticles }       from "./SnowParticles";
import { GroundTerrain }       from "./GroundTerrain";
import { ForestBase }          from "./ForestBase";
import { BoulderField }        from "./BoulderField";
import { ClimbingDetail }      from "./ClimbingDetail";
import { LocationManager }     from "./LocationManager";
import { LocationVisuals }     from "./LocationVisuals";
import { ChalkParticles }      from "./ChalkParticles";
import { BeaconSprite }        from "./BeaconSprite";
import { BackgroundMountains } from "./BackgroundMountains";
import { BJJBelts }            from "./BJJBelts";
import { AgentCaveNook }       from "./AgentCaveNook";
import { BouncyBoulder }       from "./BouncyBoulder";
import { useSkyTransition }    from "@/hooks/useSkyTransition";
import { useAudioManager }     from "@/hooks/useAudioManager";
import { useDeviceQuality }    from "@/hooks/useDeviceQuality";
import type { useGamePhase }   from "@/hooks/useGamePhase";
import type { Location }       from "@/data/locations";

type Props = {
  gamePhase: ReturnType<typeof useGamePhase>;
  onLocationChange: (loc: Location | null) => void;
  onClimbStateChange?: (climbing: boolean) => void;
  onRequestOpenChat: () => void;
  audio: ReturnType<typeof useAudioManager>;
  muted: boolean;
};

export const World = ({ gamePhase, onLocationChange, onClimbStateChange, onRequestOpenChat, audio, muted }: Props) => {
  const [pos, setPos]                        = useState(() => new THREE.Vector3());
  const [characterHeading, setCharacterHeading] = useState(0);
  const [mountainScene, setMountainScene]    = useState<THREE.Object3D | null>(null);
  const [isClimbing, setIsClimbing]          = useState(false);
  const handleClimbChange = (c: boolean) => { setIsClimbing(c); onClimbStateChange?.(c); };
  const [holdGrabTick, setHoldGrabTick]      = useState(0);
  const holdGrabPosRef                       = useRef<THREE.Vector3 | null>(null);
  const velocityRef                          = useRef({ x: 0, y: 0 });
  const boulderLaunchRef                     = useRef(false);
  const prevPosRef                            = useRef(new THREE.Vector3());
  const { phase, onCharacterY, beginDescent } = gamePhase;
  const sky                                  = useSkyTransition(phase);
  const quality                              = useDeviceQuality();
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

  const handleHoldGrab = (p: THREE.Vector3) => {
    holdGrabPosRef.current = p.clone();
    setHoldGrabTick(t => t + 1);
  };

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

      {/* Key light — character shadow only; matcaps handle environmental lighting */}
      <directionalLight
        position={[-6, 8, 6]}
        intensity={1.2}
        color="#ffd4a0"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={0.5}
        shadow-camera-far={30}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
      />

      <Sky
        distance={450000}
        sunPosition={sky.sunPosition}
        inclination={0.49}
        azimuth={0.25}
        rayleigh={sky.rayleigh}
        turbidity={sky.turbidity}
      />
      <Physics gravity={[0, -9.81, 0]}>
        {/* Big ground plane so character has walkable terrain around the mountain */}
        <RigidBody type="fixed" colliders={false}>
          <CuboidCollider args={[200, 0.5, 200]} position={[0, -0.5, 0]} />
        </RigidBody>
        <Mountain onSceneReady={setMountainScene} />
        <HoldMarkers characterPos={pos} />
        <ChossSystem characterPos={pos} velocityRef={velocityRef} />
        <Character onPositionChange={handlePositionChange} onHeadingChange={setCharacterHeading} onClimbChange={handleClimbChange} onHoldGrab={handleHoldGrab} holds={HOLDS} gamePhase={phase} audio={audio} muted={muted} mountainScene={mountainScene} boulderLaunchRef={boulderLaunchRef} />
      </Physics>

      <SummitLedge phase={phase} />
      <SummitObjects phase={phase} />
      <ChalkParticles characterPos={pos} isClimbing={isClimbing} holdGrabTick={holdGrabTick} holdGrabPos={holdGrabPosRef.current} />
      <DustParticles characterPos={pos} count={quality === "low" ? 15 : quality === "medium" ? 30 : 60} />
      <SnowParticles characterPos={pos} phase={phase} count={quality === "low" ? 30 : quality === "medium" ? 60 : 120} />
      <GroundTerrain phase={phase} />
      <BackgroundMountains quality={quality} />
      {/* ClimbingDetail still disabled — G-series coordinates */}
      <ForestBase phase={phase} quality={quality} />
      <BoulderField phase={phase} quality={quality} />
      <LocationVisuals phase={phase} />
      <LocationManager characterPos={pos} phase={phase} onLocationChange={onLocationChange} audio={audio} muted={muted} isClimbing={isClimbing} />
      <BJJBelts characterPos={pos} phase={phase} />
      <AgentCaveNook characterPos={pos} phase={phase} />
      <BouncyBoulder characterPos={pos} phase={phase} launchRef={boulderLaunchRef} />
      <CameraRig target={pos} phase={phase} characterHeading={characterHeading} mountainScene={mountainScene} climbing={isClimbing} />
      <BeaconSprite characterPos={pos} phase={phase} onRequestOpenChat={onRequestOpenChat} audio={audio} muted={muted} quality={quality} />
    </>
  );
};
