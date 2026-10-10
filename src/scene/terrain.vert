#version 300 es

// ---------- Input: one point of the grid ----------
in vec2 a_grid;   // x: -1 (left edge) to 1 (right edge). y: 0 (nearest row) to 1 (farthest row).

// ---------- Outputs: handed on to the fragment shader ----------
out float v_row;   // which ridgeline this point is on; whole numbers are where a line is drawn
out float v_fade;  // 1 near the camera, fading to 0 at the horizon
out float v_light; // how much light this point catches: 0 in shadow, 1 fully lit

// ---------- Settings from JavaScript (uniforms) ----------
uniform float u_aspect;      // how much wider the view is than it is tall (never below 1)
uniform float u_horizon;     // where the horizon sits on screen: -1 bottom, 1 top
uniform float u_peaksFrom;   // how far across the screen the mountains start: -1 left, 1 right
uniform float u_peakHeight;  // how tall the tallest mountain can get
uniform float u_drift;       // how far the land has rolled toward the camera
uniform vec3 u_light;        // the pointer light on the ground: x, distance, strength

// ---------- Fixed settings ----------
const float FAR = 20.0;           // distance to the farthest row
const float CAMERA_HEIGHT = 1.0;  // how high the camera is above the ground
const float LINES = 44.0;         // how many ridgelines are drawn from near to far

// The direction the dawn light comes from: the left, low in the sky, on the camera's side.
const vec3 SUN = vec3(-0.75, 0.30, -0.60);

// A repeatable "random" number from 0 to 1 for a grid cell.
// The same cell always gives the same number.
float hash(ivec2 cell) {
  uint h = uint(cell.x) * 0x9E3779B1u ^ uint(cell.y) * 0x85EBCA77u;
  h ^= h >> 15u;
  h *= 0x2C1B3C6Du;
  h ^= h >> 12u;
  return float(h) / 4294967295.0;
}

// Smooth noise: a random value at each corner of the cell,
// blended smoothly across the cell.
float valueNoise(vec2 point) {
  ivec2 cell = ivec2(floor(point));
  vec2 inside = fract(point);
  vec2 blend = inside * inside * (3.0 - 2.0 * inside);

  float bottomLeft = hash(cell);
  float bottomRight = hash(cell + ivec2(1, 0));
  float topLeft = hash(cell + ivec2(0, 1));
  float topRight = hash(cell + ivec2(1, 1));

  float bottom = mix(bottomLeft, bottomRight, blend.x);
  float top = mix(topLeft, topRight, blend.x);
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
  // Where this spot shows up across the screen: -1 left edge, 1 right edge.
  float across = ground.x / (ground.y * u_aspect);

  // Mountains only rise to the right of u_peaksFrom, and only at a distance.
  float besideCopy = smoothstep(u_peaksFrom, u_peaksFrom + 0.6, across);
  float farEnough = smoothstep(2.5, 7.0, ground.y);

  // The land rolls slowly toward the camera: read the noise from further along.
  vec2 travelled = vec2(ground.x, ground.y + u_drift);

  float rolling = 0.2 * valueNoise(travelled * 0.8);
  float peaks = u_peakHeight * ridges(travelled * 0.2) * besideCopy * farEnough;

  // The ground swells a little under the pointer light.
  vec2 toLight = ground - u_light.xy;
  float distanceToLightSquared = dot(toLight, toLight);
  float swell = 0.3 * u_light.z * exp(-distanceToLightSquared / 4.0);

  return rolling + peaks + swell;
}

void main() {
  // ---------- 1. Where is this point on the ground? ----------

  // Start the land just below the bottom edge of the screen, so no rows are wasted.
  float near = 0.8 / (1.0 + u_horizon);

  // How far away is this row? Row 0 is near, row 1 is FAR.
  float depth = 1.0 / mix(1.0 / near, 1.0 / FAR, a_grid.y);

  // A row twice as far away has to be twice as wide to still fill the screen.
  float groundX = a_grid.x * depth * u_aspect;
  vec2 ground = vec2(groundX, depth);

  float height = terrainHeight(ground);

  // ---------- 2. Where does it go on screen? ----------

  // Perspective: the farther away, the closer to the horizon line.
  float x = a_grid.x;
  float y = u_horizon + (height - CAMERA_HEIGHT) / depth;

  // Depth for the graphics card: -1 for the nearest row, 1 for the farthest.
  float z = (depth - near) / (FAR - near) * 2.0 - 1.0;

  gl_Position = vec4(x, y, z, 1.0);

  // ---------- 3. How much light does it catch? ----------

  // Which way does the land face here? Measure the height a small step to the
  // right and a small step further away, and build an arrow pointing straight
  // out of the surface. That arrow is called the normal.
  float nudge = 0.03 * depth;
  float heightRight = terrainHeight(ground + vec2(nudge, 0.0));
  float heightBehind = terrainHeight(ground + vec2(0.0, nudge));
  vec3 normal = normalize(vec3(height - heightRight, nudge, height - heightBehind));

  // Dawn light: land facing the sun is lit. Crests catch more of it than valleys.
  float facingSun = max(dot(normal, SUN), 0.0);
  float crest = smoothstep(0.1, 0.5, height / u_peakHeight);
  float sunLight = facingSun * mix(0.3, 1.0, crest);

  // Pointer light: a soft round pool that stays roughly the same size on screen.
  vec2 toLight = ground - u_light.xy;
  float distanceToLightSquared = dot(toLight, toLight);
  float reach = 0.9 + 0.3 * u_light.y;
  float pointerLight = u_light.z * exp(-distanceToLightSquared / (reach * reach));

  // ---------- 4. Hand the results to the fragment shader ----------
  v_row = a_grid.y * LINES;
  v_fade = 1.0 - smoothstep(FAR * 0.35, FAR, depth);
  v_light = min(sunLight + pointerLight, 1.0);
}