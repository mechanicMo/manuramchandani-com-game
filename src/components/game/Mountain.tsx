// src/components/game/Mountain.tsx
//
// Loads the tagged mountain GLB (public/models/mountain.tagged.glb) and places it
// into the scene at 100x scale with Y-axis rotation to face the rock toward the
// default camera. Grounding (placing base at y=0) is computed at load time from
// the scene's bounding box — the tagger does NOT pre-ground the mesh because
// Blender's glTF exporter rewrites its Y as -Z (wrong axis).
//
// Placeholder materials by mesh-name prefix. G12 matcap pass will override later.
import { Suspense, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { RigidBody } from "@react-three/rapier";
import * as THREE from "three";

const MOUNTAIN_URL = "/models/mountain.tagged.glb";
const MOUNTAIN_SCALE = 100;
const ROCK_COLOR = "#4a5568";
const SNOW_COLOR = "#e8eef5";
const CAVE_COLOR = "#2d3748";

useGLTF.preload(MOUNTAIN_URL);

const MountainInner = () => {
  const { scene } = useGLTF(MOUNTAIN_URL);

  const { clonedScene, meshLocalOffset, rotationY } = useMemo(() => {
    const cloned = scene.clone(true);

    // Apply placeholder materials by name prefix
    cloned.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh) return;
      if (mesh.name.startsWith("snow_")) {
        mesh.material = new THREE.MeshStandardMaterial({ color: SNOW_COLOR, roughness: 0.9 });
      } else if (mesh.name.startsWith("cave_")) {
        mesh.material = new THREE.MeshStandardMaterial({ color: CAVE_COLOR, roughness: 1.0 });
      } else {
        mesh.material = new THREE.MeshStandardMaterial({ color: ROCK_COLOR, roughness: 0.85 });
      }
      mesh.castShadow = true;
      mesh.receiveShadow = true;
    });

    // Collect per-submesh bounding boxes in mesh-local coords
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
    const groundY = anchor.min.y;

    // Average unit-normal of climb_* faces in mesh-local coords
    const climbNormal = new THREE.Vector3();
    cloned.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh || !mesh.name.startsWith("climb_")) return;
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

    return { clonedScene: cloned, meshLocalOffset: meshOffset, rotationY: rotY };
  }, [scene]);

  return (
    <RigidBody type="fixed" colliders="trimesh">
      <group scale={MOUNTAIN_SCALE} rotation={[0, rotationY, 0]}>
        <primitive object={clonedScene} position={meshLocalOffset} />
      </group>
    </RigidBody>
  );
};

export const Mountain = () => (
  <Suspense fallback={null}>
    <MountainInner />
  </Suspense>
);
