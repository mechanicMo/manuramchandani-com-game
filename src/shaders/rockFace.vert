uniform float uTime;
varying vec2 vUv;
varying float vElevation;

// Simple value noise
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
  vUv = uv;
  vElevation = position.y;

  // Multi-octave displacement
  float n = noise(position.xy * 0.3) * 0.5
          + noise(position.xy * 0.8) * 0.25
          + noise(position.xy * 2.0) * 0.125;

  vec3 displaced = position;
  displaced.z += n * 0.8;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
}
