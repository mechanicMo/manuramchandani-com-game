uniform float uCliffHeight;
varying vec2 vUv;
varying float vElevation;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1,0)), f.x),
    mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), f.x),
    f.y
  );
}

void main() {
  // Normalized height 0-1
  float h = clamp((vElevation + 5.0) / uCliffHeight, 0.0, 1.0);

  // Base strata colors
  vec3 basalt   = vec3(0.12, 0.10, 0.09);
  vec3 granite  = vec3(0.32, 0.26, 0.22);
  vec3 limestone = vec3(0.45, 0.40, 0.35);
  vec3 frost    = vec3(0.58, 0.56, 0.54);
  vec3 snow     = vec3(0.82, 0.84, 0.88);

  // Blend strata
  vec3 color = basalt;
  color = mix(color, granite,   smoothstep(0.15, 0.30, h));
  color = mix(color, limestone, smoothstep(0.42, 0.56, h));
  color = mix(color, frost,     smoothstep(0.65, 0.76, h));
  color = mix(color, snow,      smoothstep(0.80, 0.90, h));

  // Quartz veins
  float vein = smoothstep(0.96, 1.0, noise(vUv * vec2(3.0, 18.0)));
  color = mix(color, vec3(0.70, 0.68, 0.65), vein * 0.6);

  // Moss patches
  float mossN = noise(vUv * 4.0) * noise(vUv * 9.0);
  float mossMask = smoothstep(0.5, 0.7, mossN) * (1.0 - smoothstep(0.0, 0.35, h));
  vec3 mossColor = vec3(0.18, 0.28, 0.14);
  color = mix(color, mossColor, mossMask * 0.7);

  // Surface variation
  float variation = noise(vUv * 12.0) * 0.08 - 0.04;
  color += variation;

  gl_FragColor = vec4(color, 1.0);
}
