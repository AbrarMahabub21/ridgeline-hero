#version 300 es

in vec2 a_grid;

const float NEAR = 1.0;  
const float FAR = 20.0;
const float CAMERA_HEIGHT = 1.0;
const float HORIZON = -0.3;

void main() {

  float depth = 1.0 / mix(1.0/NEAR, 1.0/FAR, a_grid.y);

  float groundX = a_grid.x * depth;

  float hills = 0.5 + 0.5 * sin(groundX * 0.6) * sin(depth * 0.7);
  float height = hills * min(depth*0.3, 3.0);


  float x = a_grid.x;
  float y = HORIZON + (height - CAMERA_HEIGHT) / depth;

  gl_Position = vec4(x, y, 0.0, 1.0);
  gl_PointSize = 2.0;
}