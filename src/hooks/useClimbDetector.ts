import { useEffect, useRef } from "react";
import { useRapier } from "@react-three/rapier";
import * as THREE from "three";

export const useClimbDetector = (mountainScene: THREE.Object3D | null) => {
  const { world } = useRapier();
  const colliderNameMap = useRef<Map<number, string>>(new Map());

  useEffect(() => {
    if (!mountainScene) return;
    // Wait 1 frame for Rapier to register mountain colliders after mount
    const timer = setTimeout(() => {
      mountainScene.traverse((child) => {
        const mesh = child as THREE.Mesh;
        if (!mesh.isMesh || !mesh.name) return;
        const bbox = new THREE.Box3().setFromObject(mesh);
        const center = new THREE.Vector3();
        const half = new THREE.Vector3();
        bbox.getCenter(center);
        bbox.getSize(half).multiplyScalar(0.5);
        // API: collidersWithAabbIntersectingAabb(center, halfExtents, callback)
        world.collidersWithAabbIntersectingAabb(
          { x: center.x, y: center.y, z: center.z },
          { x: half.x, y: half.y, z: half.z },
          (collider) => {
            colliderNameMap.current.set(collider.handle, mesh.name);
            return true; // continue iteration
          }
        );
      });
    }, 100);
    return () => clearTimeout(timer);
  }, [mountainScene, world]);

  const getMeshName = (handle: number): string | null =>
    colliderNameMap.current.get(handle) ?? null;

  return { getMeshName };
};
