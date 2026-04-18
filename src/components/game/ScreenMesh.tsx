// src/components/game/ScreenMesh.tsx
import { useTexture } from "@react-three/drei";

type Props = {
  imagePath: string;
  width: number;
  height: number;
  emissiveIntensity?: number;
  glowColor?: string;
};

export const ScreenMesh = ({
  imagePath,
  width,
  height,
  emissiveIntensity = 1.2,
  glowColor = "#ffffff",
}: Props) => {
  const texture = useTexture(imagePath);

  return (
    <>
      <mesh>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial
          map={texture}
          emissive={glowColor}
          emissiveMap={texture}
          emissiveIntensity={emissiveIntensity}
          roughness={0.1}
          metalness={0.0}
        />
      </mesh>
      {/* Subtle screen glow */}
      <pointLight intensity={1.5} color={glowColor} distance={5} decay={2} />
    </>
  );
};
