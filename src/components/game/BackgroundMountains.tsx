// src/components/game/BackgroundMountains.tsx
import { useMemo } from "react";

const LAYERS = [
  { z: -25, height: 40, color: "#1a1820", count: 6, spread: 70, yBase: -5 },
  { z: -45, height: 60, color: "#141218", count: 7, spread: 90, yBase: -8 },
  { z: -80, height: 80, color: "#0e0c10", count: 5, spread: 110, yBase: -10 },
];

export const BackgroundMountains = () => {
  const mountains = useMemo(() => {
    let s = 999;
    const rand = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };

    return LAYERS.flatMap((layer, li) =>
      Array.from({ length: layer.count }, (_, i) => {
        const xOffset = (rand() - 0.5) * layer.spread;
        const width   = 12 + rand() * 18;
        const heightVar = layer.height * (0.7 + rand() * 0.6);
        return {
          id: `${li}-${i}`,
          x: xOffset,
          y: layer.yBase + heightVar * 0.5,
          z: layer.z,
          width,
          height: heightVar,
          color: layer.color,
        };
      })
    );
  }, []);

  return (
    <group>
      {mountains.map((m) => (
        <mesh key={m.id} position={[m.x, m.y, m.z]}>
          <coneGeometry args={[m.width, m.height, 5]} />
          <meshStandardMaterial color={m.color} fog={true} roughness={1} metalness={0} />
        </mesh>
      ))}
    </group>
  );
};
