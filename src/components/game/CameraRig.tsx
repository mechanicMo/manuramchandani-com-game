// src/components/game/CameraRig.tsx
// E3 — Exploration orbit camera.
// Free orbit via left-click drag (desktop) or one-finger swipe (mobile).
// Scroll wheel / pinch = zoom. Azimuth springs toward behind-character when idle.
import { useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const Y_AXIS       = new THREE.Vector3(0, 1, 0);
const raycaster    = new THREE.Raycaster();
const MIN_CAM_DIST = 1.5;
const CAM_SKIN     = 0.3;

// Orbit drag sensitivity
const AZIMUTH_SENS   = 0.006;
const ELEVATION_SENS = 0.005;
const ZOOM_SENS      = 0.012;
// Pixels of movement before we register as a drag (not a click)
const DRAG_THRESHOLD = 6;

// Elevation clamps (radians): 4° min, 80° max
const ELEV_MIN = 0.07;
const ELEV_MAX = Math.PI * 0.44;

// Spring constant for azimuth drift back to behind-character (very gentle — doesn't fight user)
const AZ_SPRING = 0.018;

// Phase presets: [distance, elevation]
const PRESETS: Record<string, [number, number]> = {
  ascent:  [8,  0.32],
  summit:  [18, 0.48],
  descent: [10, 0.40],
  climb:   [22, 0.55],
};

type Props = {
  target: THREE.Vector3;
  phase?: "ascent" | "summit" | "descent";
  characterHeading?: number;
  mountainScene?: THREE.Object3D | null;
  climbing?: boolean;
  cinematicPull?: boolean;
  summitArriving?: boolean;
};

export const CameraRig = ({
  target,
  phase = "ascent",
  characterHeading = 0,
  mountainScene = null,
  climbing = false,
  cinematicPull = false,
  summitArriving = false,
}: Props) => {
  const { camera, gl } = useThree();

  const key = climbing ? "climb" : phase;
  const [presetDist, presetElev] = PRESETS[key] ?? PRESETS.ascent;

  // Orbit state — all mutated in event handlers and useFrame, never trigger re-render
  const azimuthRef   = useRef(characterHeading + Math.PI);
  const elevationRef = useRef(presetElev);
  const distanceRef  = useRef(presetDist);

  // Smoothed camera values (what we actually set per frame)
  const smAzimuth   = useRef(characterHeading + Math.PI);
  const smElevation = useRef(presetElev);
  const smDistance  = useRef(presetDist);

  // Cinematic pull-out state (beacon lighting)
  const prevCinematic = useRef(false);
  const cinematicTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cinematicActive = useRef(false);

  // Summit arrival cinematic
  const prevSummitArriving = useRef(false);

  // Drag state
  const dragging     = useRef(false);
  const moveDistance = useRef(0);
  const lastPtr      = useRef({ x: 0, y: 0 });

  // Touch pinch state
  const pinchDist = useRef<number | null>(null);

  // Whether user is actively orbiting (suppresses spring-drift)
  const orbitingRef = useRef(false);
  const orbitIdleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Smooth lookAt target
  const lookAtRef = useRef(new THREE.Vector3());

  const markOrbiting = () => {
    orbitingRef.current = true;
    if (orbitIdleTimer.current) clearTimeout(orbitIdleTimer.current);
    // After 3s of no orbit input, allow spring-drift to resume
    orbitIdleTimer.current = setTimeout(() => {
      orbitingRef.current = false;
    }, 3000);
  };

  useEffect(() => {
    const canvas = gl.domElement;

    // ── Mouse ───────────────────────────────────────────────────────────────
    const onMouseDown = (e: MouseEvent) => {
      // Allow any button to start orbit
      dragging.current    = true;
      moveDistance.current = 0;
      lastPtr.current     = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      const dx = e.clientX - lastPtr.current.x;
      const dy = e.clientY - lastPtr.current.y;
      moveDistance.current += Math.abs(dx) + Math.abs(dy);
      lastPtr.current = { x: e.clientX, y: e.clientY };

      // Only orbit once movement exceeds threshold (prevents click-to-3D-object from orbiting)
      if (moveDistance.current < DRAG_THRESHOLD) return;

      azimuthRef.current   -= dx * AZIMUTH_SENS;
      elevationRef.current -= dy * ELEVATION_SENS;
      elevationRef.current  = Math.max(ELEV_MIN, Math.min(ELEV_MAX, elevationRef.current));
      markOrbiting();
    };

    const onMouseUp = () => { dragging.current = false; };

    const onWheel = (e: WheelEvent) => {
      distanceRef.current += e.deltaY * ZOOM_SENS;
      distanceRef.current  = Math.max(3, Math.min(28, distanceRef.current));
      markOrbiting();
    };

    // ── Touch ───────────────────────────────────────────────────────────────
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        lastPtr.current     = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        moveDistance.current = 0;
        dragging.current    = true;
        pinchDist.current   = null;
      } else if (e.touches.length === 2) {
        dragging.current  = false;
        const dx = e.touches[1].clientX - e.touches[0].clientX;
        const dy = e.touches[1].clientY - e.touches[0].clientY;
        pinchDist.current = Math.hypot(dx, dy);
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1 && dragging.current) {
        const dx = e.touches[0].clientX - lastPtr.current.x;
        const dy = e.touches[0].clientY - lastPtr.current.y;
        moveDistance.current += Math.abs(dx) + Math.abs(dy);
        lastPtr.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        azimuthRef.current   -= dx * AZIMUTH_SENS;
        elevationRef.current -= dy * ELEVATION_SENS;
        elevationRef.current  = Math.max(ELEV_MIN, Math.min(ELEV_MAX, elevationRef.current));
        markOrbiting();
      } else if (e.touches.length === 2 && pinchDist.current !== null) {
        const dx   = e.touches[1].clientX - e.touches[0].clientX;
        const dy   = e.touches[1].clientY - e.touches[0].clientY;
        const dist = Math.hypot(dx, dy);
        const delta = pinchDist.current - dist;
        distanceRef.current += delta * ZOOM_SENS * 2;
        distanceRef.current  = Math.max(3, Math.min(28, distanceRef.current));
        pinchDist.current    = dist;
        markOrbiting();
      }
    };

    const onTouchEnd = () => {
      dragging.current  = false;
      pinchDist.current = null;
    };

    canvas.addEventListener("mousedown", onMouseDown);
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    canvas.addEventListener("wheel", onWheel, { passive: true });
    canvas.addEventListener("touchstart", onTouchStart, { passive: true });
    canvas.addEventListener("touchmove", onTouchMove, { passive: true });
    canvas.addEventListener("touchend", onTouchEnd);

    return () => {
      canvas.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      canvas.removeEventListener("wheel", onWheel);
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", onTouchEnd);
      if (orbitIdleTimer.current) clearTimeout(orbitIdleTimer.current);
    };
  }, [gl]);

  useFrame((state, delta) => {
    // Cinematic pull-out: when beacon is lit, yank camera back dramatically
    if (cinematicPull && !prevCinematic.current) {
      prevCinematic.current = true;
      cinematicActive.current = true;
      distanceRef.current = 42;
      elevationRef.current = 0.68;
      orbitingRef.current = true;
      if (cinematicTimer.current) clearTimeout(cinematicTimer.current);
      cinematicTimer.current = setTimeout(() => {
        cinematicActive.current = false;
        orbitingRef.current = false;
      }, 6000);
    }

    // Summit arrival cinematic: pull back wide for 2.5s then ease to summit preset
    if (summitArriving && !prevSummitArriving.current) {
      prevSummitArriving.current = true;
      distanceRef.current  = 22;
      elevationRef.current = 0.52;
      orbitingRef.current  = true;
    }
    if (!summitArriving && prevSummitArriving.current) {
      prevSummitArriving.current = false;
      orbitingRef.current = false;
    }

    // Nudge preset distance and elevation toward current phase when no active orbit
    if (!orbitingRef.current) {
      distanceRef.current += (presetDist - distanceRef.current) * delta * 0.8;
      elevationRef.current += (presetElev - elevationRef.current) * delta * 0.8;

      // Azimuth spring-drift toward behind-character
      const targetAz = characterHeading + Math.PI;
      // Compute shortest angular path
      let diff = ((targetAz - azimuthRef.current + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
      azimuthRef.current += diff * AZ_SPRING;
    }

    // Smooth camera values (fast lerp, feels responsive)
    const lf = 1 - Math.exp(-10 * delta);
    smAzimuth.current   += (azimuthRef.current   - smAzimuth.current)   * lf;
    smElevation.current += (elevationRef.current - smElevation.current) * lf;
    smDistance.current  += (distanceRef.current  - smDistance.current)  * lf;

    // Convert spherical to Cartesian offset
    const el  = smElevation.current;
    const az  = smAzimuth.current;
    const d   = smDistance.current;
    const offset = new THREE.Vector3(
      Math.sin(az) * Math.cos(el) * d,
      Math.sin(el) * d,
      Math.cos(az) * Math.cos(el) * d,
    );

    // Collision-avoidance: raycast from target toward desired camera position
    let finalDist = d;
    if (mountainScene && d > 0) {
      const dir = offset.clone().normalize();
      raycaster.set(target, dir);
      raycaster.near = 0;
      raycaster.far  = d;
      const hits = raycaster.intersectObject(mountainScene, true);
      if (hits.length > 0) {
        finalDist = Math.max(MIN_CAM_DIST, hits[0].distance - CAM_SKIN);
      }
    }
    const finalOffset = offset.clone().normalize().multiplyScalar(finalDist);

    // Apply
    const desired = target.clone().add(finalOffset);
    camera.position.lerp(desired, 0.10); // 0.14→0.10: slightly more weight, cinematic feel

    // Subtle vertical bob while climbing — makes camera feel alive
    if (climbing) {
      camera.position.y += Math.sin(state.clock.elapsedTime * 8) * 0.015;
    }

    // LookAt slightly above character center for better framing
    const lookTarget = new THREE.Vector3(target.x, target.y + 1.2, target.z);
    lookAtRef.current.lerp(lookTarget, 0.10);
    camera.lookAt(lookAtRef.current);
  });

  return null;
};
