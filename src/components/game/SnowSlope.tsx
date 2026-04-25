// src/components/game/SnowSlope.tsx
// Snowboard descent slope — visible during summit and descent phases.
// Slope spans from summit edge (y=82, z=-42) down to base (y=0, z≈-96),
// matching the mathematical descent path in Character.tsx.
import { useMemo, memo } from "react";
import * as THREE from "three";
import type { GamePhase } from "@/hooks/useGamePhase";
import { useMatcaps } from "@/hooks/useMatcaps";

// Seeded RNG — deterministic tree placement
function makeRand(seed: number) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

type SnowTreeDef = { id: number; x: number; z: number; height: number; radius: number };

function makeLandingTrees(): SnowTreeDef[] {
  const rand = makeRand(137);
  const trees: SnowTreeDef[] = [];
  for (let i = 0; i < 28; i++) {
    const side = rand() < 0.5 ? -1 : 1;
    const xBase = 19 + rand() * 18;      // 19–37 from center
    const x     = side * xBase;
    const z     = -62 - rand() * 48;     // z: -62 to -110
    trees.push({
      id: i, x, z,
      height: 2.2 + rand() * 2.8,
      radius: 0.6 + rand() * 0.8,
    });
  }
  return trees;
}

const LANDING_TREES = makeLandingTrees();

const SLOPE_Z_START  = -42;   // matches Character.tsx SNOW_SLOPE_START_Z
const SLOPE_Z_END    = -100;  // a few units past actual end for clean edge
const SLOPE_Y_TOP    = 82;
const SLOPE_Z_RATIO  = 0.65;  // matches Character.tsx
const SLOPE_WIDTH    = 34;    // X span — wider than the ±12 player corridor

// Y on slope for a given world-Z
const yForZ = (z: number) =>
  Math.max(0, SLOPE_Y_TOP + (z - SLOPE_Z_START) / SLOPE_Z_RATIO);

type Props = { phase: GamePhase };

export const SnowSlope = ({ phase }: Props) => {
  const matcaps = useMatcaps();

  const slopeGeometry = useMemo(() => {
    const segsX = 28;
    const segsZ = 44;
    const zLen  = Math.abs(SLOPE_Z_END - SLOPE_Z_START); // 58 units
    const xStep = SLOPE_WIDTH / segsX;
    const zStep = zLen / segsZ;

    const positions: number[] = [];
    const indices:   number[] = [];

    for (let iz = 0; iz <= segsZ; iz++) {
      for (let ix = 0; ix <= segsX; ix++) {
        const x      = -SLOPE_WIDTH / 2 + ix * xStep;
        const worldZ = SLOPE_Z_START + iz * zStep;   // goes -42 → -100
        const baseY  = yForZ(worldZ);

        // Gentle undulation — natural compressed-snow surface with subtle moguls
        const undulation =
          Math.sin(x * 0.22 + worldZ * 0.12) * 0.55 +
          Math.sin(x * 0.55 + worldZ * 0.35 + 1.1) * 0.25 +
          Math.sin(worldZ * 0.18) * 0.35;

        positions.push(x, baseY + undulation, worldZ);
      }
    }

    for (let iz = 0; iz < segsZ; iz++) {
      for (let ix = 0; ix < segsX; ix++) {
        const a = iz * (segsX + 1) + ix;
        const b = a + 1;
        const c = a + (segsX + 1);
        const d = c + 1;
        indices.push(a, c, b, b, c, d);
      }
    }

    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    g.setIndex(indices);
    g.computeVertexNormals();
    return g;
  }, []);

  // Sidewall berms — snow drifts piled on the edges of the run
  const bermGeometry = useMemo(() => {
    const segsZ = 36;
    const zLen  = Math.abs(SLOPE_Z_END - SLOPE_Z_START);
    const zStep = zLen / segsZ;
    const bermWidth = 4.5;
    const bermHeight = 2.8;
    const segsX = 6;
    const positions: number[] = [];
    const indices:   number[] = [];

    const buildSide = (sideX: number, offset: number) => {
      const vertBase = positions.length / 3;
      for (let iz = 0; iz <= segsZ; iz++) {
        for (let ix = 0; ix <= segsX; ix++) {
          const worldZ   = SLOPE_Z_START + iz * zStep;
          const slopeBaseY = yForZ(worldZ);
          const t        = ix / segsX; // 0 at slope edge, 1 at outer wall
          // Berm cross-section: parabolic mound
          const bermY    = slopeBaseY + bermHeight * (1 - t * t) * 0.9
                         + Math.sin(worldZ * 0.2 + offset) * 0.4;
          const x        = sideX + (sideX > 0 ? t : -t) * bermWidth;
          positions.push(x, bermY, worldZ);
        }
      }
      for (let iz = 0; iz < segsZ; iz++) {
        for (let ix = 0; ix < segsX; ix++) {
          const a = vertBase + iz * (segsX + 1) + ix;
          const b = a + 1;
          const c = a + (segsX + 1);
          const d = c + 1;
          if (sideX > 0) {
            indices.push(a, b, c, b, d, c);
          } else {
            indices.push(a, c, b, b, c, d);
          }
        }
      }
    };

    buildSide(-SLOPE_WIDTH / 2, 0);
    buildSide( SLOPE_WIDTH / 2, 1.7);

    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    g.setIndex(indices);
    g.computeVertexNormals();
    return g;
  }, []);

  // Flat snow base at the bottom — landing zone around the kiosk
  const baseGeometry = useMemo(() => {
    const w = 50;
    const d = 28;
    const segsX = 18;
    const segsZ = 10;
    const centerZ = -92;

    const positions: number[] = [];
    const indices:   number[] = [];

    for (let iz = 0; iz <= segsZ; iz++) {
      for (let ix = 0; ix <= segsX; ix++) {
        const x  = -w / 2 + (ix / segsX) * w;
        const z  = centerZ - d / 2 + (iz / segsZ) * d;
        const y  = Math.sin(x * 0.18) * 0.3 + Math.sin(z * 0.22) * 0.25;
        positions.push(x, y, z);
      }
    }

    for (let iz = 0; iz < segsZ; iz++) {
      for (let ix = 0; ix < segsX; ix++) {
        const a = iz * (segsX + 1) + ix;
        const b = a + 1;
        const c = a + (segsX + 1);
        const d = c + 1;
        indices.push(a, c, b, b, c, d);
      }
    }

    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    g.setIndex(indices);
    g.computeVertexNormals();
    return g;
  }, []);

  if (phase === "ascent") return null;

  return (
    <group>
      {/* Main slope surface */}
      <mesh geometry={slopeGeometry} receiveShadow castShadow>
        <meshMatcapMaterial matcap={matcaps.snow} side={THREE.DoubleSide} />
      </mesh>

      {/* Sidewall berms */}
      <mesh geometry={bermGeometry} receiveShadow>
        <meshMatcapMaterial matcap={matcaps.snow} side={THREE.DoubleSide} />
      </mesh>

      {/* Base landing zone */}
      <mesh geometry={baseGeometry} receiveShadow>
        <meshMatcapMaterial matcap={matcaps.snow} />
      </mesh>

      {/* Landing zone trees */}
      {LANDING_TREES.map(tree => (
        <SnowTree key={tree.id} {...tree} matcaps={matcaps} />
      ))}

      {/* Ambient fill — cold blue glow under the slope */}
      <pointLight
        position={[0, 40, -68]}
        color="#c0d8f0"
        intensity={0.8}
        distance={100}
        decay={1.5}
      />
    </group>
  );
};

// Low-poly snow-covered pine — 3 cone tiers + trunk + snow caps
const SnowTree = memo(({ x, z, height, radius, matcaps }: SnowTreeDef & { matcaps: ReturnType<typeof useMatcaps> }) => {
  // Place tree at the slope surface height, or at y=0 in the flat landing zone
  const groundY = z >= SLOPE_Z_END ? yForZ(z) : 0;

  const tiers = [
    { yBase: height * 0.08, r: radius,        h: height * 0.45 },
    { yBase: height * 0.35, r: radius * 0.70, h: height * 0.38 },
    { yBase: height * 0.58, r: radius * 0.44, h: height * 0.30 },
  ];

  return (
    <group position={[x, groundY, z]}>
      {/* Trunk */}
      <mesh position={[0, height * 0.06, 0]} castShadow>
        <cylinderGeometry args={[radius * 0.08, radius * 0.10, height * 0.14, 6]} />
        <meshMatcapMaterial matcap={matcaps.wood} />
      </mesh>

      {tiers.map((tier, i) => (
        <group key={i}>
          <mesh position={[0, tier.yBase, 0]} castShadow>
            <coneGeometry args={[tier.r, tier.h, 10, 1]} />
            <meshMatcapMaterial matcap={matcaps.foliage} />
          </mesh>
          {/* Snow cap on each tier tip */}
          <mesh position={[0, tier.yBase + tier.h * 0.46, 0]}>
            <sphereGeometry args={[tier.r * (0.26 - i * 0.04), 6, 5]} />
            <meshMatcapMaterial matcap={matcaps.snow} />
          </mesh>
        </group>
      ))}
    </group>
  );
});
