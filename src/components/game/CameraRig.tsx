import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const Y_AXIS = new THREE.Vector3(0, 1, 0);
const tmpQuat = new THREE.Quaternion();
const tmpVec  = new THREE.Vector3();

type Props = {
  target: THREE.Vector3;
  phase?: "ascent" | "summit" | "descent";
  characterHeading?: number;
};

const OFFSETS = {
  ascent:  new THREE.Vector3(1.5, 2, 6),
  summit:  new THREE.Vector3(0,   3, 8),
  descent: new THREE.Vector3(0,   1, 5),
};

export const CameraRig = ({ target, phase = "ascent", characterHeading = 0 }: Props) => {
  const { camera } = useThree();
  const lookAtRef  = useRef(new THREE.Vector3());
  const offsetRef  = useRef(new THREE.Vector3());

  useFrame(() => {
    const base = OFFSETS[phase];
    // Rotate base offset by characterHeading around Y so camera stays behind character
    const headingQuat = tmpQuat.setFromAxisAngle(Y_AXIS, characterHeading);
    const rotated = tmpVec.copy(base).applyQuaternion(headingQuat);

    offsetRef.current.lerp(rotated, 0.05);

    const desired = target.clone().add(offsetRef.current);
    camera.position.lerp(desired, 0.08);

    lookAtRef.current.lerp(
      new THREE.Vector3(target.x, target.y + 1, target.z),
      0.08
    );
    camera.lookAt(lookAtRef.current);
  });

  return null;
};
