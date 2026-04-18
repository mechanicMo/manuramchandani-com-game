import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

type Props = {
  target: THREE.Vector3;
  phase?: "ascent" | "summit" | "descent";
};

const OFFSETS = {
  ascent:  new THREE.Vector3(1.5, 2, 6),
  summit:  new THREE.Vector3(0,   3, 8),
  descent: new THREE.Vector3(0,   1, 5),
};

export const CameraRig = ({ target, phase = "ascent" }: Props) => {
  const { camera } = useThree();
  const lookAtRef  = useRef(new THREE.Vector3());
  const offsetRef  = useRef(new THREE.Vector3());

  useFrame(() => {
    const offset = OFFSETS[phase];

    offsetRef.current.lerp(offset, 0.05);

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
