// src/components/game/Character.tsx
import { useRef, useEffect } from "react";
import type React from "react";
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
const SPAWN_POS: [number, number, number] = [0, 5, 65]; // in front of climb face (world Z≈36); character faces -Z toward mountain
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
const SIDE_RANGE            = { minX: -11, maxX: 11 }; // descent snowboard lateral bounds
const DESCEND_BASE          = 3.0;
const DESCEND_TUCK          = 6.0;
const SNOW_SLOPE_START_Z    = -42;  // world-space Z of snow slope top (−Z side, opposite from climb face at +Z)
const SLOPE_Z_RATIO         = 0.65; // Z outward per Y-unit descended (slope angle ~33° from vertical)
const CLIMB_DETECT_RANGE    = 12; // THREE.js ray range — long enough to see climb face through the collision shell

// Scratch vectors — module level to avoid per-frame allocation
const tmpVec3A = new THREE.Vector3(); // camera forward
const tmpVec3B = new THREE.Vector3(); // camera right
const moveVec = new THREE.Vector3(); // frame movement delta
const Y_UP = new THREE.Vector3(0, 1, 0);
const climbRaycaster = new THREE.Raycaster(); // reused per frame for climb detection

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
  onHoldGrab?: (pos: THREE.Vector3) => void;
  holds?: Hold[];
  gamePhase?: GamePhase;
  audio?: ReturnType<typeof useAudioManager>;
  muted?: boolean;
  mountainScene?: THREE.Object3D | null;
  boulderLaunchRef?: React.MutableRefObject<boolean>;
};

export const Character = ({
  onPositionChange,
  onHeadingChange,
  onClimbChange,
  onHoldGrab,
  holds = [],
  gamePhase = "ascent",
  audio,
  muted = false,
  mountainScene,
  boulderLaunchRef,
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
  const facingYawRef = useRef(Math.PI); // face -Z at spawn (toward climb face at +36Z)
  const climbFrames = useRef(0);
  const jumpWasDown = useRef(false);
  const prevGamePhase = useRef<GamePhase>("ascent");
  const targetHold = useRef<Hold | null>(null);
  const jumpingToHold = useRef(false);
  const descentStarted = useRef(false);
  const climbingRef     = useRef(false);
  // Per-face climb geometry — derived at attach time from world-space mesh data
  const climbNormalRef  = useRef(new THREE.Vector3(0, 0, 1));  // outward world normal
  const climbTangentRef = useRef(new THREE.Vector3(1, 0, 0));  // horizontal strafe direction
  const climbNAnchorRef = useRef(36);   // normal component of contact point
  const climbTMinRef    = useRef(-11);  // tangent-axis strafe min
  const climbTMaxRef    = useRef(11);   // tangent-axis strafe max
  const climbYawRef     = useRef(Math.PI); // character facing into rock

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
    // Summit reached while climbing — exit climb and snap to summit plateau center
    if (gamePhase === "summit" && modeRef.current === "climb") {
      modeRef.current = "walk";
      vertVelRef.current = 0;
      const snap = { x: 0, y: 82, z: 0 };
      posRef.current.set(snap.x, snap.y, snap.z);
      rigidBodyRef.current?.setNextKinematicTranslation(snap);
      facingYawRef.current = 0; // face +Z to look out from summit
      if (modelGroupRef.current) modelGroupRef.current.rotation.y = 0;
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
      if (modelGroupRef.current) modelGroupRef.current.rotation.y = Math.PI;
      facingYawRef.current = Math.PI;
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
      facingYawRef.current = climbYawRef.current;

      const n = climbNormalRef.current;
      const t = climbTangentRef.current;
      // Fixed distance from rock surface along outward normal
      const nFixed = climbNAnchorRef.current + CAPSULE_RADIUS;

      // Hold-jump (SPACE → nearest upper hold)
      if (intent.jump && !jumpingToHold.current && holds.length) {
        const nearest = holds
          .filter((h) =>
            h.y > posRef.current.y + 0.5 &&
            Math.abs(h.z - posRef.current.z) < 15
          )
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

      let newX: number, newY: number, newZ: number;

      if (jumpingToHold.current && targetHold.current) {
        // Lerp along face tangent + Y toward hold (works for any face orientation)
        const tCurr   = posRef.current.x * t.x + posRef.current.z * t.z;
        const tTarget = targetHold.current.x * t.x + targetHold.current.z * t.z;
        const tNew    = THREE.MathUtils.lerp(tCurr, tTarget, 0.1);
        newY = THREE.MathUtils.lerp(posRef.current.y, targetHold.current.y, 0.1);
        newX = t.x * tNew + n.x * nFixed;
        newZ = t.z * tNew + n.z * nFixed;
        if (Math.hypot(tNew - tTarget, newY - targetHold.current.y) < 0.12) {
          onHoldGrab?.(posRef.current.clone());
          jumpingToHold.current = false;
          targetHold.current = null;
        }
      } else {
        const dY = intent.climbUp * CLIMB_SPEED_Y * delta;
        const dT = intent.climbStrafe * CLIMB_SPEED_X * delta;
        const tCurr = posRef.current.x * t.x + posRef.current.z * t.z;
        const tNew  = THREE.MathUtils.clamp(tCurr + dT, climbTMinRef.current, climbTMaxRef.current);
        newY = THREE.MathUtils.clamp(posRef.current.y + dY, 0, 90);
        newX = t.x * tNew + n.x * nFixed;
        newZ = t.z * tNew + n.z * nFixed;
      }

      body.setNextKinematicTranslation({ x: newX, y: newY, z: newZ });
      posRef.current.set(newX, newY, newZ);

      // Exit climb → walk: character descended to ground level (only exit when not pressing up — prevents flat-ground entry from immediately popping back to walk)
      if (newY < 2.0 && intent.climbUp <= 0) {
        if (climbingRef.current) {
          climbingRef.current = false;
          onClimbChange?.(false);
        }
        modeRef.current = "walk";
        vertVelRef.current = 0;
      }

      // Face into rock surface
      if (modelGroupRef.current) {
        modelGroupRef.current.rotation.y = climbYawRef.current;
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
      p.z -= descentSpeed * SLOPE_Z_RATIO * delta; // slide outward toward −Z (snow slope side)

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
      // Bouncy boulder super-launch
      if (boulderLaunchRef?.current) {
        boulderLaunchRef.current = false;
        vertVelRef.current = JUMP_IMPULSE * 3.8;
      }
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
      const airborne = !controller.computedGrounded();
      if (airborne && vertVelRef.current > 2) {
        crossFade(actions, "jump");
      } else if (airborne && vertVelRef.current < -2) {
        crossFade(actions, "fall");
      } else {
        crossFade(actions, "idle");
      }
    }

    // Climb attach check — uses THREE.js mesh raycasting to find climb_* faces by name.
    // Rapier's single compound trimesh can't distinguish submeshes; THREE.js can.
    const checkClimbAttach = () => {
      if (!body || !mountainScene) return;
      const pos = body.translation();
      const dir = { x: Math.sin(facingYawRef.current), y: 0, z: Math.cos(facingYawRef.current) };

      const dirVec = tmpVec3B.set(dir.x, dir.y, dir.z).normalize();
      climbRaycaster.near = 0;
      climbRaycaster.far = CLIMB_DETECT_RANGE;

      const isClimbFace = (h: THREE.Intersection) =>
        (h.object as THREE.Mesh).name?.startsWith("climb_") && h.point.y > 0 && h.point.y < 85;

      climbRaycaster.set(tmpVec3A.set(pos.x, pos.y, pos.z), dirVec);
      let climbHit = climbRaycaster.intersectObject(mountainScene, true).find(isClimbFace) ?? null;

      // Fallback: elevated ray catches face geometry above character (e.g. face_2 / face_hidden at y≈3+)
      if (!climbHit) {
        climbRaycaster.set(tmpVec3A.set(pos.x, pos.y + 3, pos.z), dirVec);
        climbHit = climbRaycaster.intersectObject(mountainScene, true).find(isClimbFace) ?? null;
      }

      const isMoving = Math.abs(intent.forward) + Math.abs(intent.strafe) > 0.2;
      if (climbHit && isMoving) {
        climbFrames.current++;
        if (climbFrames.current >= CLIMB_ATTACH_FRAMES) {
          modeRef.current = "climb";
          climbFrames.current = 0;
          vertVelRef.current = 0;

          const mesh = climbHit.object as THREE.Mesh;

          // World-space outward normal (object-space face normal transformed by full world matrix)
          const worldNormal = climbHit.face!.normal.clone()
            .transformDirection(mesh.matrixWorld).normalize();

          // Character faces INTO the rock
          climbYawRef.current = Math.atan2(-worldNormal.x, -worldNormal.z);
          climbNormalRef.current.copy(worldNormal);

          // Horizontal strafe direction: perpendicular to normal in XZ plane
          climbTangentRef.current.set(worldNormal.z, 0, -worldNormal.x).normalize();

          // Normal component of the contact point (fixed throughout this climb)
          climbNAnchorRef.current =
            climbHit.point.x * worldNormal.x + climbHit.point.z * worldNormal.z;

          // World-space bbox projected onto tangent → derive strafe clamping range
          mesh.geometry.computeBoundingBox();
          const bbox = mesh.geometry.boundingBox!.clone().applyMatrix4(mesh.matrixWorld);
          const t = climbTangentRef.current;
          const projs = [
            bbox.min.x * t.x + bbox.min.z * t.z,
            bbox.max.x * t.x + bbox.min.z * t.z,
            bbox.min.x * t.x + bbox.max.z * t.z,
            bbox.max.x * t.x + bbox.max.z * t.z,
          ];
          climbTMinRef.current = Math.min(...projs);
          climbTMaxRef.current = Math.max(...projs);

          // Snap character in front of surface using world-space normal
          const snapX = climbHit.point.x + worldNormal.x * CAPSULE_RADIUS;
          const snapZ = climbHit.point.z + worldNormal.z * CAPSULE_RADIUS;
          body.setNextKinematicTranslation({ x: snapX, y: pos.y, z: snapZ });
          posRef.current.x = snapX;
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
      <group ref={modelGroupRef} rotation={[0, Math.PI, 0]}>
        <primitive object={scene} scale={1} />
      </group>
    </RigidBody>
  );
};
