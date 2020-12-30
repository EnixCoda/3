import { assert } from "./utils";

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

export function createRender(
  gl: WebGL2RenderingContext,
  vertexShaderSource: string,
  fragmentShaderSource: string,
  setupState: (gl: WebGL2RenderingContext, program: WebGLProgram) => void
) {
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  const fragmentShader = createShader(
    gl,
    gl.FRAGMENT_SHADER,
    fragmentShaderSource
  );

  const program = createProgram(gl, vertexShader, fragmentShader);

  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  // attribute position
  {
    const targetBuffer = gl.ARRAY_BUFFER;
    gl.bindBuffer(targetBuffer, gl.createBuffer());
    gl.bufferData(
      targetBuffer,
      new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]),
      gl.STATIC_DRAW
    );
    const location_attribute_position = gl.getAttribLocation(
      program,
      `a_position`
    );
    gl.enableVertexAttribArray(location_attribute_position);
    gl.vertexAttribPointer(
      location_attribute_position,
      3,
      gl.FLOAT,
      false,
      0,
      0
    );
  }

  return function render() {
    gl.useProgram(program);
    gl.bindVertexArray(vao); // necessary? why?

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    setupState(gl, program);

    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };
}

export function getCanvasSize(
  gl: WebGL2RenderingContext
): { width: number; height: number } {
  const dpr = window.devicePixelRatio;

  return gl.canvas instanceof HTMLCanvasElement
    ? {
        width: gl.canvas.clientWidth * dpr,
        height: gl.canvas.clientHeight * dpr,
      }
    : {
        width: 400 * dpr,
        height: 300 * dpr,
      };
}

export function createWebGL2Context(canvas: HTMLCanvasElement | null) {
  if (!canvas) throw new Error(`No canvas found`);
  const gl = canvas.getContext("webgl2");
  return gl;
}
