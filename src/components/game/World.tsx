// src/components/game/World.tsx
import React, { useRef, useState, useEffect } from "react";
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
import { LizHeart }            from "./LizHeart";
import { SnowSlope }           from "./SnowSlope";
import { SpeedLines }          from "./SpeedLines";
import { DataMotes }           from "./DataMotes";
import { CarveTrail }          from "./CarveTrail";
import { CircuitRunes }        from "./CircuitRunes";
import { StarField }           from "./StarField";
import { SlalomGates }         from "./SlalomGates";
import { CloudLayer }          from "./CloudLayer";
import { Aurora }              from "./Aurora";
import { MineralVeins }        from "./MineralVeins";
import { LandingFlare }        from "./LandingFlare";
import { useSkyTransition }    from "@/hooks/useSkyTransition";
import { useAudioManager }     from "@/hooks/useAudioManager";
import { useDeviceQuality }    from "@/hooks/useDeviceQuality";
import type { useGamePhase }   from "@/hooks/useGamePhase";
import { isMobileJumpDown }    from "@/hooks/useTouchControls";
import type { Location }       from "@/data/locations";

type Props = {
  gamePhase: ReturnType<typeof useGamePhase>;
  onLocationChange: (loc: Location | null) => void;
  onClimbStateChange?: (climbing: boolean) => void;
  onRequestOpenChat: () => void;
  audio: ReturnType<typeof useAudioManager>;
  muted: boolean;
  altBarRef?: React.RefObject<HTMLDivElement | null>;
  altTextRef?: React.RefObject<HTMLDivElement | null>;
};

export const World = ({ gamePhase, onLocationChange, onClimbStateChange, onRequestOpenChat, audio, muted, altBarRef, altTextRef }: Props) => {
  const [pos, setPos]                        = useState(() => new THREE.Vector3());
  const [characterHeading, setCharacterHeading] = useState(0);
  const [mountainScene, setMountainScene]    = useState<THREE.Object3D | null>(null);
  const [isClimbing, setIsClimbing]          = useState(false);
  const [beaconLit, setBeaconLit]            = useState(false);
  const handleClimbChange = (c: boolean) => { setIsClimbing(c); onClimbStateChange?.(c); };
  const [holdGrabTick, setHoldGrabTick]      = useState(0);
  const holdGrabPosRef                       = useRef<THREE.Vector3 | null>(null);
  const velocityRef                          = useRef({ x: 0, y: 0 });
  const boulderLaunchRef                     = useRef(false);
  const prevPosRef                            = useRef(new THREE.Vector3());
  const { phase, onCharacterY, beginDescent, summitArriving } = gamePhase;
  const sky                                  = useSkyTransition(phase);
  const quality                              = useDeviceQuality();
  const spacePressed                         = useKeyboardControls((s: Record<string, boolean>) => s.jump);
  const spaceRef                             = useRef(false);
  const spaceWasDown                         = useRef(false);
  const ambientLightRef                      = useRef<THREE.Light>(null);
  const rimLightRef                          = useRef<THREE.SpotLight>(null);
  const rimTargetRef                         = useRef(new THREE.Object3D());

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

  // Keep a ref in sync with keyboard state so useFrame can read it
  spaceRef.current = spacePressed;

  useFrame(() => {
    // Summit → descent: Space (keyboard) or mobile jump button
    const anyJump = spaceRef.current || isMobileJumpDown();
    if (anyJump && !spaceWasDown.current && phase === "summit") {
      beginDescent();
    }
    spaceWasDown.current = anyJump;

    if (ambientLightRef.current) {
      ambientLightRef.current.intensity = sky.ambientIntensity;
      (ambientLightRef.current as THREE.Light).color.setStyle(sky.ambientColor);
    }

    // Rim light trails behind-above the character, separating it from the cliff
    if (rimLightRef.current) {
      rimLightRef.current.position.set(pos.x, pos.y + 3, pos.z - 5);
      rimTargetRef.current.position.set(pos.x, pos.y + 1, pos.z);
      rimTargetRef.current.updateMatrixWorld();
      rimLightRef.current.target = rimTargetRef.current;
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
    onCharacterY(p.y, p.z);
    // Imperatively update altitude bar + label — avoids React re-render per frame
    if (altBarRef?.current && phase === "ascent") {
      const pct = Math.min(p.y / 80, 1) * 100;
      altBarRef.current.style.height = `${pct}%`;
      if (altTextRef?.current) {
        const m = Math.round((1800 + (p.y / 80) * 2500) / 100) * 100;
        altTextRef.current.textContent = `~${m.toLocaleString()}m`;
      }
    }
  };

  return (
    <>
      <fogExp2 attach="fog" args={[sky.fogColor, sky.fogDensity]} />

      {/* Ambient — night is deep blue-black, not grey */}
      <ambientLight ref={ambientLightRef} intensity={sky.ambientIntensity} color={sky.ambientColor} />

      {/* Rim light — blue-cool backlight that follows the character, separates from cliff */}
      <spotLight
        ref={rimLightRef}
        intensity={1.5}
        color="#d0e8ff"
        angle={0.5}
        penumbra={0.5}
        distance={14}
        castShadow={false}
      />

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
        <ChossSystem characterPos={pos} velocityRef={velocityRef} phase={phase} />
        <Character onPositionChange={handlePositionChange} onHeadingChange={setCharacterHeading} onClimbChange={handleClimbChange} onHoldGrab={handleHoldGrab} holds={HOLDS} gamePhase={phase} audio={audio} muted={muted} mountainScene={mountainScene} boulderLaunchRef={boulderLaunchRef} />
        <SummitLedge phase={phase} quality={quality} />
      </Physics>
      <SummitObjects phase={phase} characterPos={pos} onBeaconLit={() => setBeaconLit(true)} />
      <ChalkParticles characterPos={pos} isClimbing={isClimbing} holdGrabTick={holdGrabTick} holdGrabPos={holdGrabPosRef.current} />
      <DustParticles characterPos={pos} count={quality === "low" ? 15 : quality === "medium" ? 30 : 60} />
      <SnowParticles characterPos={pos} phase={phase} count={quality === "low" ? 30 : quality === "medium" ? 60 : 120} />
      <SpeedLines characterPos={pos} phase={phase} velocityRef={velocityRef} />
      <DataMotes phase={phase} />
      <CarveTrail characterPos={pos} phase={phase} />
      <CircuitRunes phase={phase} />
      <StarField phase={phase} characterY={pos.y} quality={quality} />
      <SlalomGates phase={phase} />
      <CloudLayer phase={phase} quality={quality} />
      <Aurora phase={phase} visible={beaconLit} quality={quality} />
      <MineralVeins phase={phase} quality={quality} />
      <LandingFlare phase={phase} characterPos={pos} quality={quality} />
      <GroundTerrain phase={phase} />
      <SnowSlope phase={phase} />
      <BackgroundMountains quality={quality} />
      <ClimbingDetail phase={phase} />
      <ForestBase phase={phase} quality={quality} />
      <BoulderField phase={phase} quality={quality} />
      <LocationVisuals phase={phase} />
      <LocationManager characterPos={pos} phase={phase} onLocationChange={onLocationChange} audio={audio} muted={muted} isClimbing={isClimbing} />
      <BJJBelts characterPos={pos} phase={phase} />
      <AgentCaveNook characterPos={pos} phase={phase} />
      <BouncyBoulder characterPos={pos} phase={phase} launchRef={boulderLaunchRef} />
      <LizHeart characterPos={pos} />
      <CameraRig target={pos} phase={phase} characterHeading={characterHeading} mountainScene={mountainScene} climbing={isClimbing} cinematicPull={beaconLit} summitArriving={summitArriving} />
      <BeaconSprite characterPos={pos} phase={phase} onRequestOpenChat={onRequestOpenChat} audio={audio} muted={muted} quality={quality} />
    </>
  );
};
