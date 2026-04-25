import { useMemo } from "react";
import * as THREE from "three";

// Returns a MeshMatcapMaterial with faked warm ground bounce baked in.
// Faces pointing downward get a warm orange-brown tint — simulates indirect bounce from earth.
export function useMatcapWithGroundBounce(
  matcap: THREE.Texture,
  bounceColor = "#6a3a1a",
  bounceIntensity = 0.35
): THREE.MeshMatcapMaterial {
  return useMemo(() => {
    const mat = new THREE.MeshMatcapMaterial({ matcap });

    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uBounceColor     = { value: new THREE.Color(bounceColor) };
      shader.uniforms.uBounceIntensity = { value: bounceIntensity };

      shader.vertexShader = shader.vertexShader.replace(
        "#include <common>",
        `#include <common>
varying vec3 vWorldNormal;`
      );
      shader.vertexShader = shader.vertexShader.replace(
        "#include <beginnormal_vertex>",
        `#include <beginnormal_vertex>
vWorldNormal = normalize(mat3(modelMatrix) * objectNormal);`
      );

      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <common>",
        `#include <common>
uniform vec3 uBounceColor;
uniform float uBounceIntensity;
varying vec3 vWorldNormal;`
      );
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <tonemapping_fragment>",
        `float bounce = clamp(-vWorldNormal.y, 0.0, 1.0);
gl_FragColor.rgb = mix(gl_FragColor.rgb, gl_FragColor.rgb * uBounceColor * 2.0, bounce * uBounceIntensity);
#include <tonemapping_fragment>`
      );
    };

    mat.needsUpdate = true;
    return mat;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matcap, bounceColor, bounceIntensity]);
}
