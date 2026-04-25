import { useTexture } from "@react-three/drei";
import * as THREE from "three";

export type MatcapKey =
  | "stoneDark"
  | "stoneLight"
  | "wood"
  | "metalSoft"
  | "fabric"
  | "foliage"
  | "snow"
  | "plasticDark";

const MATCAP_PATHS: Record<MatcapKey, string> = {
  stoneDark:   "/matcaps/stone-dark.png",
  stoneLight:  "/matcaps/stone-light.png",
  wood:        "/matcaps/wood.png",
  metalSoft:   "/matcaps/metal-soft.png",
  fabric:      "/matcaps/fabric.png",
  foliage:     "/matcaps/foliage.png",
  snow:        "/matcaps/snow.png",
  plasticDark: "/matcaps/plastic-dark.png",
};

export function useMatcaps(): Record<MatcapKey, THREE.Texture> {
  const textures = useTexture(Object.values(MATCAP_PATHS)) as THREE.Texture[];
  const keys = Object.keys(MATCAP_PATHS) as MatcapKey[];
  return Object.fromEntries(keys.map((k, i) => [k, textures[i]])) as Record<MatcapKey, THREE.Texture>;
}
