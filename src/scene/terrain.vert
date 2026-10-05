#version 300 es

in vec2 a_grid;
out float v_row; // which ridgeline this point is on; whole numbers are where a line is drawn
out float v_fade; // 1 near the camera, fading to 0 at the horizon

const float NEAR = 1.0;  
const float FAR = 20.0;
const float CAMERA_HEIGHT = 1.0;
const float HORIZON = -0.3;
const float PEAK_HEIGHT = 3.5; //how tall a taller mountain can get
const float LINES = 44.0; // how many ridgelines are drawn from near to far

// A repeatable "random" number from 0 to 1 for a grid cell.
// The same cell always gives the same number.
float hash(ivec2 cell){
  uint h = uint(cell.x) * 0x9E3779B1u ^ uint(cell.y) * 0x85EBCA77u;
  h ^= h >> 15u;
  h *= 0x2C1B3C6Du;
  h ^= h >> 12u;
  return float(h) / 4294967295.0;
}

float valueNoise(vec2 point){
  ivec2 cell = ivec2(floor(point));
  vec2 inside = fract(point);
  vec2 blend = inside * inside * (3.0 - 2.0 * inside);

  float bottom = mix(hash(cell), hash(cell + ivec2(1, 0)), blend.x);
  float top = mix(hash(cell + ivec2(0, 1)), hash(cell + ivec2(1, 1)), blend.x);
  return mix(bottom, top, blend.y);
}

// Mountain ridges: four layers of noise, each finer and weaker than the last.
// Folding each layer around its middle turns soft bumps into sharp crests.
float ridges(vec2 point) {
  float total = 0.0;
  float strength = 0.5;

  for (int layer = 0; layer < 4; layer++) {
    float fold = 1.0 - abs(2.0 * valueNoise(point) - 1.0);
    total += fold * fold * strength;
    point *= 2.0;
    strength *= 0.5;
  }

  return total;
}

// Height of the land at a spot on the ground.
// ground.x is left to right, ground.y is distance from the camera.
float terrainHeight(vec2 ground) {
  float rolling = 0.2 * valueNoise(ground * 0.8);
  float farEnough = smoothstep(2.5, 7.0, ground.y);
  float peaks = PEAK_HEIGHT * ridges(ground * 0.3) * farEnough;
  return rolling + peaks;
}

void main() {

  float depth = 1.0 / mix(1.0/NEAR, 1.0/FAR, a_grid.y);

  vec2 ground = vec2(a_grid.x * depth, depth);

  float height = terrainHeight(ground);


  float x = a_grid.x;
  float y = HORIZON + (height - CAMERA_HEIGHT) / depth;
  float z = (depth - NEAR) / (FAR - NEAR) * 2.0 - 1.0;

  gl_Position = vec4(x, y, z, 1.0);
  
  v_row = a_grid.y * LINES;
  v_fade = 1.0 - smoothstep(FAR * 0.35, FAR, depth);
}