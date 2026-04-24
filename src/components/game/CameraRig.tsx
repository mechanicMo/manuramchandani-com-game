import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const Y_AXIS    = new THREE.Vector3(0, 1, 0);
const tmpQuat   = new THREE.Quaternion();
const tmpVec    = new THREE.Vector3();
const tmpDir    = new THREE.Vector3();
const raycaster = new THREE.Raycaster();
const MIN_CAM_DIST = 1.5; // never pull camera closer than this to character
const CAM_SKIN     = 0.3; // pull back this much from any wall hit to avoid near-plane clipping

type Props = {
  target: THREE.Vector3;
  phase?: "ascent" | "summit" | "descent";
  characterHeading?: number;
  mountainScene?: THREE.Object3D | null;
  climbing?: boolean;
};

const OFFSETS = {
  ascent:  new THREE.Vector3(0, 3, 8),  // 3rd-person behind character; collision avoidance pulls in when clipping
  summit:  new THREE.Vector3(0, 3, 8),
  descent: new THREE.Vector3(0, 1, 5),
  climb:   new THREE.Vector3(0, 8, 22), // pulled back in front of face so player can see holds above them
};

export const CameraRig = ({ target, phase = "ascent", characterHeading = 0, mountainScene = null, climbing = false }: Props) => {
  const { camera } = useThree();
  const lookAtRef  = useRef(new THREE.Vector3());
  const offsetRef  = useRef(new THREE.Vector3());

  useFrame(() => {
    const base = climbing ? OFFSETS.climb : OFFSETS[phase];
    // characterHeading is the direction the character FACES.
    // Camera sits behind the character's back, so rotate the base offset by heading + π.
    const headingQuat = tmpQuat.setFromAxisAngle(Y_AXIS, characterHeading + Math.PI);
    const rotatedOffset = tmpVec.copy(base).applyQuaternion(headingQuat);

    // Collision-avoidance raycast: from character toward desired camera pos.
    // If mountain mesh is in the way, pull camera in to just-before the hit.
    const desiredDist = rotatedOffset.length();
    let actualDist = desiredDist;
    if (mountainScene && desiredDist > 0) {
      tmpDir.copy(rotatedOffset).normalize();
      raycaster.set(target, tmpDir);
      raycaster.near = 0;
      raycaster.far = desiredDist;
      const hits = raycaster.intersectObject(mountainScene, true);
      if (hits.length > 0) {
        actualDist = Math.max(MIN_CAM_DIST, hits[0].distance - CAM_SKIN);
      }
    }

    // Apply the (possibly-shortened) offset
    rotatedOffset.normalize().multiplyScalar(actualDist);
    offsetRef.current.lerp(rotatedOffset, 0.15);

    const desired = target.clone().add(offsetRef.current);
    camera.position.lerp(desired, 0.15);

    lookAtRef.current.lerp(
      new THREE.Vector3(target.x, target.y + 1, target.z),
      0.15
    );
    camera.lookAt(lookAtRef.current);
  });

  return null;
};
