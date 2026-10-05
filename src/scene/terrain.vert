#version 300 es

in vec2 a_grid;

void main() {
  float x = a_grid.x;
  float y = a_grid.y - 1.0;

  gl_Position = vec4(x, y, 0.0, 1.0);
  gl_PointSize = 3.0;
}