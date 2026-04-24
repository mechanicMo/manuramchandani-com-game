// src/components/game/Character.tsx
import { useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF, useAnimations } from "@react-three/drei";
import { RigidBody, CapsuleCollider, useRapier } from "@react-three/rapier";
import type { RigidBody as RapierRigidBody } from "@dimforge/rapier3d-compat";
import * as THREE from "three";
import { useCharacterController } from "@/hooks/useCharacterController";
import type { Hold } from "./HoldMarkers";
import type { GamePhase } from "@/hooks/useGamePhase";
import type { useAudioManager } from "@/hooks/useAudioManager";

useGLTF.preload("/character-animated.glb");

// ============================================================================
// Constants
// ============================================================================
const CAPSULE_HALF_HEIGHT = 0.6;
const CAPSULE_RADIUS = 0.4;
const SPAWN_POS: [number, number, number] = [0, 5, -65]; // directly in front of climb face at Z=-36; walk forward (+Z) to reach it
const WALK_SPEED = 8.0;
const GRAVITY = 30.0;
const JUMP_IMPULSE = 12.0;
const MAX_SLOPE_CLIMB = 55; // degrees
const STEP_HEIGHT = 0.4;
const SNAP_TO_GROUND = 0.3;

const CLIMB_SPEED_Y         = 4.0;
const CLIMB_SPEED_X         = 4.0;
const HOLD_NEAR             = 2.5;
const FORWARD_RAYCAST_RANGE = CAPSULE_RADIUS + 0.8;
const CLIMB_ATTACH_FRAMES   = 3;
const SIDE_RANGE            = { minX: -11, maxX: 11 }; // climb_face_1 width = 22 units, centered at x=0
const DESCEND_BASE          = 3.0;
const DESCEND_TUCK          = 6.0;
const SNOW_SLOPE_START_Z    = 42;   // world-space Z of snow slope top (opposite side from climb face)
const SLOPE_Z_RATIO         = 0.65; // Z-forward per Y-unit descended (slope angle ~33° from vertical)
// climb_face_1 world bounds after axis correction + grounding: X[-11,11] Y[3.5,78.7] Z[-44,-36]
const CLIMB_FACE_BOUNDS     = { xMin: -13, xMax: 13, yMin: 0, yMax: 85, zMin: -50, zMax: -28 };

// Scratch vectors — module level to avoid per-frame allocation
const tmpVec3A = new THREE.Vector3(); // camera forward
const tmpVec3B = new THREE.Vector3(); // camera right
const moveVec = new THREE.Vector3(); // frame movement delta
const Y_UP = new THREE.Vector3(0, 1, 0);

type CharacterMode = "walk" | "climb" | "summit" | "descent";
type KCCType = ReturnType<typeof useRapier>["world"]["createCharacterController"];

// ============================================================================
// Helpers
// ============================================================================
const crossFade = (
  actions: ReturnType<typeof useAnimations>["actions"],
  name: string,
  duration = 0.25,
) => {
  const next = actions[name];
  if (!next || next.isRunning()) return;
  Object.values(actions).forEach(a => a?.fadeOut(duration));
  next.reset().fadeIn(duration).play();
};

type Props = {
  onPositionChange?: (pos: THREE.Vector3) => void;
  onHeadingChange?: (yaw: number) => void;
  onClimbChange?: (climbing: boolean) => void;
  holds?: Hold[];
  gamePhase?: GamePhase;
  audio?: ReturnType<typeof useAudioManager>;
  muted?: boolean;
  mountainScene?: THREE.Object3D | null;
};

export const Character = ({
  onPositionChange,
  onHeadingChange,
  onClimbChange,
  holds = [],
  gamePhase = "ascent",
  audio,
  muted = false,
}: Props) => {
  // ============================================================================
  // Refs
  // ============================================================================
  const modelGroupRef = useRef<THREE.Group>(null);
  const posRef = useRef(new THREE.Vector3(...SPAWN_POS));
  const prevPosRef = useRef(new THREE.Vector3(...SPAWN_POS));
  const rigidBodyRef = useRef<RapierRigidBody | null>(null);
  const controllerRef = useRef<KCCType | null>(null);
  const vertVelRef = useRef(0);
  const modeRef = useRef<CharacterMode>("walk");
  const facingYawRef = useRef(0);
  const climbFrames = useRef(0);
  const jumpWasDown = useRef(false);
  const prevGamePhase = useRef<GamePhase>("ascent");
  const targetHold = useRef<Hold | null>(null);
  const jumpingToHold = useRef(false);
  const descentStarted = useRef(false);
  const climbingRef = useRef(false);

  // ============================================================================
  // Three.js and Rapier setup
  // ============================================================================
  const { camera } = useThree();
  const { world, rapier } = useRapier();
  const intent = useCharacterController();

  const { scene, animations } = useGLTF("/character-animated.glb");
  const { actions } = useAnimations(animations, modelGroupRef);

  // ============================================================================
  // KCC setup
  // ============================================================================
  useEffect(() => {
    const controller = world.createCharacterController(0.01);
    controller.setMaxSlopeClimbAngle((MAX_SLOPE_CLIMB * Math.PI) / 180);
    controller.setMinSlopeSlideAngle((55 * Math.PI) / 180);
    controller.enableAutostep(STEP_HEIGHT, 0.1, true);
    controller.enableSnapToGround(SNAP_TO_GROUND);
    controller.setApplyImpulsesToDynamicBodies(true);
    controllerRef.current = controller;
    return () => {
      controller.free();
    };
  }, [world]);

  // ============================================================================
  // Animation setup
  // ============================================================================
  useEffect(() => {
    if (!actions) return;
    const idle = actions["idle"] ?? actions[Object.keys(actions)[0]];
    idle?.reset().fadeIn(0.3).play();
    return () => {
      idle?.fadeOut(0.3);
    };
  }, [actions]);

  // ============================================================================
  // Game phase watcher (descent entry/exit)
  // ============================================================================
  useEffect(() => {
    if (climbingRef.current) {
      climbingRef.current = false;
      onClimbChange?.(false);
    }
    if (gamePhase === "descent") {
      modeRef.current = "descent";
      vertVelRef.current = 0;
      descentStarted.current = false; // triggers z-snap on next frame
    }
    // Descent → walk reset: fires when phase returns to "ascent" after having been "descent"
    if (gamePhase === "ascent" && prevGamePhase.current === "descent") {
      modeRef.current = "walk";
      vertVelRef.current = 0;
      posRef.current.set(...SPAWN_POS);
      rigidBodyRef.current?.setNextKinematicTranslation({
        x: SPAWN_POS[0], y: SPAWN_POS[1], z: SPAWN_POS[2],
      });
      if (modelGroupRef.current) modelGroupRef.current.rotation.y = 0;
      facingYawRef.current = 0;
    }
    prevGamePhase.current = gamePhase ?? "ascent";
  }, [gamePhase]);

  // ============================================================================
  // Main loop
  // ============================================================================
  useFrame((_state, delta) => {
    const body = rigidBodyRef.current;
    const controller = controllerRef.current;
    if (!body || !controller) return; // physics not ready yet — spawn safety

    if (modeRef.current === "climb") {
      // --- CLIMB MODE ---
      if (!climbingRef.current) {
        climbingRef.current = true;
        onClimbChange?.(true);
      }
      facingYawRef.current = Math.PI;

      // Hold-jump (SPACE → nearest upper hold)
      if (intent.jump && !jumpingToHold.current && holds.length) {
        const nearest = holds
          .filter((h) => h.y > posRef.current.y + 0.5)
          .sort((a, b) =>
            Math.hypot(a.x - posRef.current.x, a.y - posRef.current.y) -
            Math.hypot(b.x - posRef.current.x, b.y - posRef.current.y)
          )[0] ?? null;
        if (nearest) {
          targetHold.current = nearest;
          jumpingToHold.current = true;
          if (audio && !muted) {
            const variant = Math.ceil(Math.random() * 4);
            audio.play(`hold-grab-${variant}`, 0.6);
          }
        }
      }

      let newX: number, newY: number;
      const newZ = posRef.current.z; // Z-lock during climb

      if (jumpingToHold.current && targetHold.current) {
        newX = THREE.MathUtils.lerp(posRef.current.x, targetHold.current.x, 0.1);
        newY = THREE.MathUtils.lerp(posRef.current.y, targetHold.current.y, 0.1);
        if (Math.hypot(newX - targetHold.current.x, newY - targetHold.current.y) < 0.12) {
          jumpingToHold.current = false;
          targetHold.current = null;
        }
      } else {
        const dY = intent.climbUp * CLIMB_SPEED_Y * delta;
        const dX = intent.climbStrafe * CLIMB_SPEED_X * delta;
        newX = THREE.MathUtils.clamp(posRef.current.x + dX, SIDE_RANGE.minX, SIDE_RANGE.maxX);
        newY = THREE.MathUtils.clamp(posRef.current.y + dY, 0, 90);
      }

      body.setNextKinematicTranslation({ x: newX, y: newY, z: newZ });
      posRef.current.set(newX, newY, newZ);

      // Exit climb → walk: character descended to ground level
      if (newY < 2.0) {
        if (climbingRef.current) {
          climbingRef.current = false;
          onClimbChange?.(false);
        }
        modeRef.current = "walk";
        vertVelRef.current = 0;
      }

      // Face outward from cliff
      if (modelGroupRef.current) {
        modelGroupRef.current.rotation.y = Math.PI;
      }

      // Animation
      if (actions) {
        const movingY = Math.abs(intent.climbUp) > 0.1;
        const movingX = Math.abs(intent.climbStrafe) > 0.1;
        const atHold = !movingX && !movingY && holds.some(
          (h) => Math.hypot(posRef.current.x - h.x, posRef.current.y - h.y) < HOLD_NEAR
        );
        if (jumpingToHold.current) crossFade(actions, "jump");
        else if (movingY) crossFade(actions, intent.climbUp > 0 ? "climb_up" : "climb_down");
        else if (movingX) crossFade(actions, "idle");
        else crossFade(actions, atHold ? "hang_idle" : "idle");
      }

      onPositionChange?.(posRef.current.clone());
      onHeadingChange?.(facingYawRef.current);
      return;
    }

    if (modeRef.current === "descent") {
      // --- DESCENT MODE ---
      facingYawRef.current = 0;

      // First frame: snap to top of snow slope (+Z side of mountain)
      if (!descentStarted.current) {
        posRef.current.z = SNOW_SLOPE_START_Z;
        body.setNextKinematicTranslation({ x: posRef.current.x, y: posRef.current.y, z: SNOW_SLOPE_START_Z });
        descentStarted.current = true;
      }

      const descentSpeed = intent.tuck ? DESCEND_TUCK : DESCEND_BASE;
      const p = posRef.current;

      p.y = THREE.MathUtils.clamp(p.y - descentSpeed * delta, 0, 90);
      p.x = THREE.MathUtils.clamp(p.x + intent.strafe * WALK_SPEED * delta, SIDE_RANGE.minX, SIDE_RANGE.maxX);
      p.z += descentSpeed * SLOPE_Z_RATIO * delta; // slide outward down the snow slope

      body.setNextKinematicTranslation({ x: p.x, y: p.y, z: p.z });
      posRef.current.copy(p);

      if (modelGroupRef.current) modelGroupRef.current.rotation.y = 0; // face forward for snowboard

      if (actions) {
        if (intent.strafe > 0.1)       crossFade(actions, "snowboard_right");
        else if (intent.strafe < -0.1) crossFade(actions, "snowboard_left");
        else                            crossFade(actions, "snowboard_idle");
      }

      onPositionChange?.(posRef.current.clone());
      onHeadingChange?.(facingYawRef.current);
      return;
    }

    if (modeRef.current === "summit") {
      // Summit is semantically walk behavior — fall through to walk logic below
    }

    // --- WALK MODE ---

    // Gravity / jump
    const grounded = controller.computedGrounded();
    if (grounded) {
      if (vertVelRef.current < 0) vertVelRef.current = 0;
      if (intent.jump) vertVelRef.current = JUMP_IMPULSE;
    } else {
      vertVelRef.current -= GRAVITY * delta;
    }

    // Camera-relative horizontal move
    camera.getWorldDirection(tmpVec3A);
    tmpVec3A.y = 0;
    if (tmpVec3A.lengthSq() > 0.0001) tmpVec3A.normalize();
    tmpVec3B.crossVectors(tmpVec3A, Y_UP).normalize(); // camRight

    moveVec.set(0, 0, 0);
    if (Math.abs(intent.forward) > 0.01)
      moveVec.addScaledVector(tmpVec3A, intent.forward * WALK_SPEED * delta);
    if (Math.abs(intent.strafe) > 0.01)
      moveVec.addScaledVector(tmpVec3B, intent.strafe * WALK_SPEED * delta);

    // GLB default direction is +Z. To rotate it so the character faces the current
    // movement direction, use atan2(mx, mz) — rotating (+Z, 0, 0) by this angle
    // produces (mx, 0, mz) normalized. CameraRig adds π internally to sit BEHIND the
    // character's back on the opposite side.
    if (moveVec.lengthSq() > 0.0001) {
      facingYawRef.current = Math.atan2(moveVec.x, moveVec.z);
    }

    // KCC movement
    const collider = body.collider(0);
    const desired = { x: moveVec.x, y: vertVelRef.current * delta, z: moveVec.z };
    controller.computeColliderMovement(collider, desired);
    const corrected = controller.computedMovement();

    const currentTrans = body.translation();
    body.setNextKinematicTranslation({
      x: currentTrans.x + corrected.x,
      y: currentTrans.y + corrected.y,
      z: currentTrans.z + corrected.z,
    });

    posRef.current.set(
      currentTrans.x + corrected.x,
      currentTrans.y + corrected.y,
      currentTrans.z + corrected.z
    );

    // Visual model rotation
    if (modelGroupRef.current) {
      modelGroupRef.current.rotation.y = facingYawRef.current;
    }

    // Animation
    if (actions) {
      const idle = actions["idle"];
      if (idle && !idle.isRunning()) {
        Object.values(actions).forEach((a) => a?.fadeOut(0.25));
        idle.reset().fadeIn(0.25).play();
      }
    }

    // Climb attach check
    const checkClimbAttach = () => {
      if (!body) return;
      const pos = body.translation();
      const dir = { x: Math.sin(facingYawRef.current), y: 0, z: Math.cos(facingYawRef.current) };
      const ray = new rapier.Ray({ x: pos.x, y: pos.y, z: pos.z }, dir);
      const hit = world.castRay(ray, FORWARD_RAYCAST_RANGE, true);
      if (!hit) {
        climbFrames.current = 0;
        return;
      }
      const hitX = pos.x + dir.x * hit.timeOfImpact;
      const hitY = pos.y + dir.y * hit.timeOfImpact;
      const hitZ = pos.z + dir.z * hit.timeOfImpact;
      const isClimb = hitX >= CLIMB_FACE_BOUNDS.xMin && hitX <= CLIMB_FACE_BOUNDS.xMax &&
                      hitY >= CLIMB_FACE_BOUNDS.yMin && hitY <= CLIMB_FACE_BOUNDS.yMax &&
                      hitZ >= CLIMB_FACE_BOUNDS.zMin && hitZ <= CLIMB_FACE_BOUNDS.zMax;
      const isMoving = Math.abs(intent.forward) + Math.abs(intent.strafe) > 0.2;
      if (isClimb && isMoving) {
        climbFrames.current++;
        if (climbFrames.current >= CLIMB_ATTACH_FRAMES) {
          modeRef.current = "climb";
          climbFrames.current = 0;
          vertVelRef.current = 0;
          // Snap Z so character sits against the rock
          const snapZ = pos.z + dir.z * Math.max(0, hit.timeOfImpact - CAPSULE_RADIUS);
          body.setNextKinematicTranslation({ x: pos.x, y: pos.y, z: snapZ });
          posRef.current.z = snapZ;
        }
      } else {
        climbFrames.current = 0;
      }
    };
    checkClimbAttach();

    onPositionChange?.(posRef.current.clone());
    onHeadingChange?.(facingYawRef.current);
  });

  // ============================================================================
  // Render
  // ============================================================================
  return (
    <RigidBody
      ref={rigidBodyRef}
      type="kinematicPosition"
      position={SPAWN_POS}
      colliders={false}
      enabledRotations={[false, false, false]}
    >
      <CapsuleCollider args={[CAPSULE_HALF_HEIGHT, CAPSULE_RADIUS]} />
      <group ref={modelGroupRef}>
        <primitive object={scene} scale={1} />
      </group>
    </RigidBody>
  );
};
