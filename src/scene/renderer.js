import vertexSource from './terrain.vert?raw';
import fragmentSource from "./terrain.frag?raw";
import {buildGrid} from './grid';

export function createRenderer(canvas){
    const gl = canvas.getContext('webgl2');
    if (!gl) return null;

    // compiling both shaders and joining them in one program
    const program = gl.createProgram();
    gl.attachShader(program, compileShader(gl, gl.VERTEX_SHADER, vertexSource));
    gl.attachShader(program, compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program));
  }
    gl.useProgram(program);


  // Sending the grid points to the graphics card.
  const points = buildGrid(120,80);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, points, gl.STATIC_DRAW);

  // Sending the grid to the graphics card: the points, then the triangles that join them.
  const grid = buildGrid(200,132);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, grid.points, gl.STATIC_DRAW);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, grid.triangles, gl.STATIC_DRAW);

  // Telling the vertex shader how to read them: 2 numbers per point, into a_grid
  const gridLocation = gl.getAttribLocation(program, 'a_grid');
  gl.enableVertexAttribArray(gridLocation);
  gl.vertexAttribPointer(gridLocation, 2, gl.FLOAT, false, 0, 0);


  // Let nearer land hide the land behind it.
  gl.enable(gl.DEPTH_TEST)
  // Finding the settings the vertex shader reads, so draw() can fill them in.
  const aspectLocation = gl.getUniformLocation(program, 'u_aspect');
  const horizonLocation = gl.getUniformLocation(program, 'u_horizon');
  const peaksFromLocation = gl.getUniformLocation(program, 'u_peaksFrom');
  const peakHeightLocation = gl.getUniformLocation(program, 'u_peakHeight');
    function resize(){
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
 }
    function draw(scene) {
    gl.uniform1f(aspectLocation, Math.max(canvas.width / canvas.height, 1));
    gl.uniform1f(horizonLocation, scene.horizon);
    gl.uniform1f(peaksFromLocation, scene.peaksFrom);
    gl.uniform1f(peakHeightLocation, scene.peakHeight);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.drawElements(gl.TRIANGLES, grid.triangles.length, gl.UNSIGNED_SHORT, 0);
  }
    return {resize, draw};
}


  function compileShader(gl, type, source){
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader));
  }

  return shader;
  }