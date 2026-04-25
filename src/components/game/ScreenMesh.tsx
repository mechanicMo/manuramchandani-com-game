// src/components/game/ScreenMesh.tsx
import { useTexture } from "@react-three/drei";

type Props = {
  imagePath: string;
  width: number;
  height: number;
  glowColor?: string;
};

export const ScreenMesh = ({
  imagePath,
  width,
  height,
  glowColor = "#ffffff",
}: Props) => {
  const texture = useTexture(imagePath);

  return (
    <>
      <mesh>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial map={texture} color={glowColor} />
      </mesh>
      <pointLight intensity={1.5} color={glowColor} distance={5} decay={2} />
    </>
  );
};
