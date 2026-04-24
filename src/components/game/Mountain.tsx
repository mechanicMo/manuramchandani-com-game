// src/components/game/Mountain.tsx
//
// Loads the tagged mountain GLB (public/models/mountain.tagged.glb) and places it
// into the scene at 100x scale with Y-axis rotation to face the rock toward the
// default camera. Grounding (placing base at y=0) is computed at load time from
// the scene's bounding box.
//
// Axis correction: the build script (build-mountain.py) uses Y as the vertical axis
// in Blender's Python API, but Blender's GLTF exporter applies a Z-up→Y-up conversion
// that rotates all vertex data 90° around X (Blender Y→GLTF -Z, Blender Z→GLTF Y).
// We bake the inverse (+90° X rotation matrix) into every mesh geometry before any
// grounding or normal calculations so all downstream code sees correct orientation.
//
// Placeholder materials by mesh-name prefix. G12 matcap pass will override later.
import { Suspense, useMemo, useEffect } from "react";
import { useGLTF } from "@react-three/drei";
import { RigidBody } from "@react-three/rapier";
import * as THREE from "three";

type MountainProps = { onSceneReady?: (scene: THREE.Object3D) => void };

const MOUNTAIN_URL = "/models/mountain.tagged.glb";
const MOUNTAIN_SCALE = 100;
const ROCK_COLOR = "#7a8c9e";
const SNOW_COLOR = "#e8eef5";
const CAVE_COLOR = "#2d3748";
const CLIMB_COLOR = "#ff00cc"; // hot pink — temporary, to locate climb faces

// +90° X rotation matrix: corrects build script Y-up → GLTF Z-up axis mismatch
const AXIS_CORRECTION = new THREE.Matrix4().makeRotationX(Math.PI / 2);

useGLTF.preload(MOUNTAIN_URL);

const MountainInner = ({ onSceneReady }: MountainProps) => {
  const { scene } = useGLTF(MOUNTAIN_URL);

  const { clonedScene, meshLocalOffset, rotationY } = useMemo(() => {
    const cloned = scene.clone(true);

    // Step 1: Bake axis correction into every mesh geometry FIRST.
    // This must happen before material assignment (which reads mesh.name) and
    // before bounding-box / normal calculations.
    cloned.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh || !mesh.geometry) return;
      const geom = mesh.geometry.clone();
      geom.applyMatrix4(AXIS_CORRECTION);
      geom.computeBoundingBox();
      geom.computeVertexNormals();
      mesh.geometry = geom;
    });

    // Step 2: Apply placeholder materials by name prefix
    cloned.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh) return;
      if (mesh.name.startsWith("snow_")) {
        mesh.material = new THREE.MeshStandardMaterial({ color: SNOW_COLOR, roughness: 0.9, side: THREE.DoubleSide });
      } else if (mesh.name.startsWith("cave_")) {
        mesh.material = new THREE.MeshStandardMaterial({ color: CAVE_COLOR, roughness: 1.0, side: THREE.DoubleSide });
      } else if (mesh.name.startsWith("climb_")) {
        mesh.material = new THREE.MeshStandardMaterial({ color: CLIMB_COLOR, roughness: 0.6, side: THREE.DoubleSide });
      } else {
        mesh.material = new THREE.MeshStandardMaterial({ color: ROCK_COLOR, roughness: 0.85, side: THREE.DoubleSide });
      }
      mesh.castShadow = true;
      mesh.receiveShadow = true;
    });

    // Step 3: Collect per-submesh bounding boxes (now in corrected local coords)
    const boxes: Record<string, THREE.Box3> = {};
    cloned.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh || !mesh.geometry) return;
      mesh.geometry.computeBoundingBox();
      if (mesh.geometry.boundingBox) boxes[mesh.name] = mesh.geometry.boundingBox.clone();
    });

    // Anchor = walk_base if present, otherwise any walk_*, otherwise overall bbox
    const walkBase = boxes["walk_base"] ?? Object.entries(boxes).find(([n]) => n.startsWith("walk_"))?.[1];
    const overallBox = new THREE.Box3();
    Object.values(boxes).forEach((b) => overallBox.union(b));
    const anchor = walkBase ?? overallBox;
    const anchorCenter = new THREE.Vector3();
    anchor.getCenter(anchorCenter);
    const groundY = anchor.max.y;

    // Step 4: Average unit-normal of climb_face_1 in corrected local coords
    const climbNormal = new THREE.Vector3();
    cloned.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh || mesh.name !== "climb_face_1") return;
      const geom = mesh.geometry;
      const posAttr = geom.attributes.position;
      const idx = geom.index;
      const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
      const ab = new THREE.Vector3(), ac = new THREE.Vector3(), n = new THREE.Vector3();
      const faceCount = idx ? idx.count / 3 : posAttr.count / 3;
      for (let f = 0; f < faceCount; f++) {
        const ia = idx ? idx.getX(f * 3)     : f * 3;
        const ib = idx ? idx.getX(f * 3 + 1) : f * 3 + 1;
        const ic = idx ? idx.getX(f * 3 + 2) : f * 3 + 2;
        a.fromBufferAttribute(posAttr, ia);
        b.fromBufferAttribute(posAttr, ib);
        c.fromBufferAttribute(posAttr, ic);
        ab.subVectors(b, a); ac.subVectors(c, a); n.crossVectors(ab, ac).normalize();
        climbNormal.add(n);
      }
    });

    // Rotation: find θ around Y that sends climb normal toward -Z (camera).
    // For a Y-rotation taking (nx, 0, nz) → (0, 0, -1), θ = atan2(nx, -nz).
    let rotY = 0;
    if (climbNormal.lengthSq() > 0) {
      climbNormal.y = 0;
      climbNormal.normalize();
      rotY = Math.atan2(climbNormal.x, -climbNormal.z);
    }

    // Mesh-local offset (before scale/rotation): puts walk_base XZ center at origin
    // and walk_base min Y at y=0 in the wrapper group's local space.
    const meshOffset: [number, number, number] = [
      -anchorCenter.x,
      -groundY,
      -anchorCenter.z,
    ];

    console.log("[Mountain] rotY =", rotY.toFixed(4), "rad =", (rotY * 180 / Math.PI).toFixed(1), "deg | meshOffset =", meshOffset);
    return { clonedScene: cloned, meshLocalOffset: meshOffset, rotationY: rotY };
  }, [scene]);

  useEffect(() => {
    onSceneReady?.(clonedScene);
  }, [clonedScene, onSceneReady]);

  return (
    <RigidBody type="fixed" colliders="trimesh">
      <group scale={MOUNTAIN_SCALE} rotation={[0, rotationY, 0]}>
        <primitive object={clonedScene} position={meshLocalOffset} />
      </group>
    </RigidBody>
  );
};

export const Mountain = ({ onSceneReady }: MountainProps) => (
  <Suspense fallback={null}>
    <MountainInner onSceneReady={onSceneReady} />
  </Suspense>
);
