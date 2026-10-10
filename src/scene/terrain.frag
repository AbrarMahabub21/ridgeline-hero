#version 300 es
precision highp float;

in float v_row;
in float v_fade;
in float v_light;

out vec4 fragColor;

const vec3 LAND_DARK = vec3(0.04, 0.07, 0.14);  // land in shadow, the same as --night
const vec3 LAND_LIT = vec3(0.11, 0.17, 0.32);   // land facing the light
const vec3 LINE = vec3(0.56, 0.65, 0.81);       // a ridgeline in shadow
const vec3 ACCENT = vec3(1.0, 0.71, 0.33);      // a ridgeline in the light, the same as --accent
const float LINE_WIDTH = 1.25;                  // ridgeline thickness in pixels

void main() {
  // How far is this pixel from the nearest ridgeline, in pixels?
  float rowsPerPixel = fwidth(v_row);
  float pixelsFromLine = abs(fract(v_row + 0.5) - 0.5) / rowsPerPixel;

  // 1 on the line, 0 away from it, with a soft edge one pixel wide.
  float halfWidth = LINE_WIDTH * 0.5;
  float line = 1.0 - smoothstep(halfWidth - 0.5, halfWidth + 0.5, pixelsFromLine);

  // Near the horizon the lines bunch together. Fade them so they read as haze.
  float pixelsBetweenLines = 1.0 / rowsPerPixel;
  line *= clamp(pixelsBetweenLines / (4.0 * LINE_WIDTH), 0.0, 1.0);

  // Light turns the land a lighter blue, and turns the ridgelines from grey to amber.
  vec3 land = mix(LAND_DARK, LAND_LIT, v_light * 0.8);
  vec3 ridgeline = mix(LINE, ACCENT, v_light);
  float lineStrength = line * mix(0.3, 1.0, v_light);

  vec3 colour = mix(land, ridgeline, lineStrength);

  // Fade the far land out so it melts into the sky behind the canvas.
  fragColor = vec4(colour * v_fade, v_fade);
}