import vertexSource from './terrain.vert?raw';
import fragmentSource from './terrain.frag?raw';
import { buildGrid } from './grid.js';

// Sets up WebGL once, and gives back two functions: resize() and draw().
// Returns null if the browser has no WebGL 2.
export function createRenderer(canvas) {
  const gl = canvas.getContext('webgl2');
  if (!gl) {
    return null;
  }

  // ---------- 1. Compile both shaders and join them into one program ----------
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);

  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program));
  }

  gl.useProgram(program);

  // ---------- 2. Send the grid to the graphics card ----------
  const grid = buildGrid(200, 132);

  // The points.
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, grid.points, gl.STATIC_DRAW);

  // The triangles that join them.
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, grid.triangles, gl.STATIC_DRAW);

  // ---------- 3. Tell the vertex shader how to read the points ----------
  // Two numbers per point, into a_grid.
  const gridLocation = gl.getAttribLocation(program, 'a_grid');
  gl.enableVertexAttribArray(gridLocation);
  gl.vertexAttribPointer(gridLocation, 2, gl.FLOAT, false, 0, 0);

  // ---------- 4. Let nearer land hide the land behind it ----------
  gl.enable(gl.DEPTH_TEST);

  // ---------- 5. Find the uniforms, so draw() can fill them in ----------
  const aspectLocation = gl.getUniformLocation(program, 'u_aspect');
  const horizonLocation = gl.getUniformLocation(program, 'u_horizon');
  const peaksFromLocation = gl.getUniformLocation(program, 'u_peaksFrom');
  const peakHeightLocation = gl.getUniformLocation(program, 'u_peakHeight');
  const driftLocation = gl.getUniformLocation(program, 'u_drift');
  const lightLocation = gl.getUniformLocation(program, 'u_light');

  // Makes the canvas's pixel size match its size on the page.
  function resize() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
  }

  // Draws one picture.
  // scene: the layout, which only changes on resize.
  // frame: the values that change every frame.
  function draw(scene, frame) {
    const aspect = Math.max(canvas.width / canvas.height, 1);

    gl.uniform1f(aspectLocation, aspect);
    gl.uniform1f(peaksFromLocation, scene.peaksFrom);
    gl.uniform1f(peakHeightLocation, scene.peakHeight);
    gl.uniform1f(horizonLocation, frame.horizon);
    gl.uniform1f(driftLocation, frame.drift);
    gl.uniform3f(lightLocation, frame.lightX, frame.lightDepth, frame.lightStrength);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.drawElements(gl.TRIANGLES, grid.triangles.length, gl.UNSIGNED_SHORT, 0);
  }

  return { resize: resize, draw: draw };
}

// Turns shader text into something the graphics card can run.
function compileShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader));
  }

  return shader;
}