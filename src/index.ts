import { GUI } from "dat.gui";
import { Camera } from "./Camera";
import { Color } from "./Color";
import { Light } from "./Lights";
import { Material } from "./Material";
import { Scene } from "./Scene";
import { Sphere } from "./Shapes";
import { assert, pick, recordDuration } from "./utils";
import { addTree } from "./utils/gui.add";
import { Position } from "./Vector";

function createShader(
  gl: WebGL2RenderingContext,
  type: number,
  source: string
) {
  const shader = gl.createShader(type);
  assert(shader);

  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    return shader;
  }

  throw new Error(`Error creating shader:` + gl.getShaderInfoLog(shader));
}

function createProgram(
  gl: WebGL2RenderingContext,
  vertexShader: WebGLShader,
  fragmentShader: WebGLShader
) {
  const program = gl.createProgram();
  assert(program);
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (gl.getProgramParameter(program, gl.LINK_STATUS)) {
    return program;
  }

  throw new Error(`Error creating program:` + gl.getProgramInfoLog(program));
}

function createRender(
  gl: WebGL2RenderingContext,
  vertexShaderSource: string,
  fragmentShaderSource: string
) {
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  const fragmentShader = createShader(
    gl,
    gl.FRAGMENT_SHADER,
    fragmentShaderSource
  );

  const program = createProgram(gl, vertexShader, fragmentShader);

  const location_attribute_position = gl.getAttribLocation(
    program,
    `a_position`
  );
  const location_uniform_resolution = gl.getUniformLocation(
    program,
    `u_resolution`
  );

  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]),
    gl.STATIC_DRAW
  );
  gl.enableVertexAttribArray(location_attribute_position);
  gl.vertexAttribPointer(location_attribute_position, 3, gl.FLOAT, false, 0, 0);

  return function render() {
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.useProgram(program);

    gl.bindVertexArray(vao);

    gl.uniform2f(
      location_uniform_resolution,
      gl.canvas.width,
      gl.canvas.height
    );

    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };
}

const vertexShaderSource = `
#version 300 es

// Available types:
// float,
// vec2, vec3, vec4,
// mat2, mat3, mat4,
// int, ivec2, ivec3, ivec4,
// uint, uvec2, uvec3, uvec4
in vec4 a_position;

// Uniform not only accepts all types available to in
// Also accepts these types:
// bool, bvec2, bvec3, and bvec4

void main(){
  gl_Position=a_position;
}
`.trim();

const fragmentShaderSource = `
#version 300 es

precision highp float;

uniform vec2 u_resolution;

out vec4 color;

vec4 strokePixel(in vec2 coord) {
  return vec4(coord.xy, 1., 1.);
}

void main(){
  color = strokePixel(fract(gl_FragCoord.xy / u_resolution.xy));
}
`.trim();

const dpr = window.devicePixelRatio;
const scale = 100;
const width = 4 * scale * dpr;
const height = 3 * scale * dpr;

const { gl } = createWebGL2Context(width, height);
function createWebGL2Context(width: number, height: number) {
  const canvas = document.createElement("canvas");
  const gl = canvas.getContext("webgl2");
  if (!gl) throw new Error("WebGL2 context not supported");

  const ratio = window.devicePixelRatio;
  canvas.width = width;
  canvas.height = height;
  canvas.style.width = width / ratio + "px";
  canvas.style.height = height / ratio + "px";
  document.body.append(canvas);

  return { canvas, gl };
}

const render = recordDuration(
  `render a frame`,
  createRender(gl, vertexShaderSource, fragmentShaderSource)
);

{
  const camera = new Camera({
    position: new Position(-2, -2, -2),
    target: new Position(0, 0, 0),
    viewport: {
      width: 4,
      height: 3,
      depth: 5,
    },
  });

  const scene = new Scene(camera);

  const shapes = [
    new Sphere(
      new Position(2, 0, 0),
      1,
      new Material(
        Color.fromHex(0xffffff),
        Color.fromHex(0xff0000),
        Color.fromHex(0xff0000),
        2,
        Color.fromHex(0xffffff)
      )
    ),
    new Sphere(
      new Position(0, 2, 0),
      1,
      new Material(
        Color.fromHex(0xffffff),
        Color.fromHex(0x00ff00),
        Color.fromHex(0x00ff00),
        2,
        Color.fromHex(0xffffff)
      )
    ),
    new Sphere(
      new Position(0, 0, 2),
      1,
      new Material(
        Color.fromHex(0xffffff),
        Color.fromHex(0x0000ff),
        Color.fromHex(0x0000ff),
        2,
        Color.fromHex(0xffffff)
      )
    ),
  ];
  scene.shapes.push(...shapes);

  const lights = [
    new Light(
      Color.fromHex(0xffffff),
      Color.fromHex(0xaaaaaa),
      new Position(-1, -1, -1)
    ),
    new Light(
      Color.fromHex(0xaaaaaa),
      Color.fromHex(0xaaaaaa),
      new Position(1, 1, 1)
    ),
  ];
  scene.lights.push(...lights);

  const ambient = Color.fromHex(0x111111);
  scene.ambient = ambient;
  const background = Color.fromHex(0x222222);
  scene.background = background;

  const g = new GUI();
  addTree(
    g,
    pick(scene, [
      "configs",
      "camera",
      "shapes",
      "lights",
      "ambient",
      "background",
    ]),
    render
  );
  render();
}
