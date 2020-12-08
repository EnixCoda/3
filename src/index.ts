import { GUI } from "dat.gui";
import React from "react";
import ReactDOM from "react-dom";
import Stats from "stats.js";
import { Camera } from "./Camera";
import { Color } from "./Color";
import { Light } from "./Lights";
import { Material } from "./Material";
import { createPlayControl } from "./playControl";
import { PlayControl } from "./PlayControlUI";
import { Scene } from "./Scene";
import { Sphere } from "./Shapes";
import { assert, handlePointerEvents, pick, updateIfNotEqual } from "./utils";
import { addTree } from "./utils/gui.add";
import { Position } from "./Vector";
import { fragmentShaderSource, vertexShaderSource } from "./vertexShaderSource";

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

  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  // attribute position
  {
    const targetBuffer = gl.ARRAY_BUFFER;
    gl.bindBuffer(targetBuffer, gl.createBuffer());
    gl.bufferData(
      targetBuffer,
      new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), // this single triangle covers (-1, -1) to (1, 1)
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
    const { width, height } = getCanvasSize(gl);

    updateIfNotEqual(gl.canvas, "width", width);
    updateIfNotEqual(gl.canvas, "height", height);
    updateIfNotEqual(scene.camera.viewport, "width", width);
    updateIfNotEqual(scene.camera.viewport, "height", height);
    updateIfNotEqual(
      scene.camera.viewport,
      "depth",
      Math.min(width, height) * 3
    );

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.useProgram(program);

    gl.bindVertexArray(vao); // necessary? why?

    // uniform ambient
    {
      gl.uniform4f(
        gl.getUniformLocation(program, `u_ambient`),
        scene.ambient.red,
        scene.ambient.green,
        scene.ambient.blue,
        1
      );
    }

    // uniform background
    {
      gl.uniform4f(
        gl.getUniformLocation(program, `u_background`),
        scene.background.red,
        scene.background.green,
        scene.background.blue,
        1
      );
    }

    // config uniforms
    {
      gl.uniform1i(
        gl.getUniformLocation(program, `u_max_reflect_times`),
        scene.configs.maxReflectTimes
      );
      gl.uniform1f(
        gl.getUniformLocation(program, `u_castRange`),
        scene.configs.castRange
      );
      gl.uniform1i(
        gl.getUniformLocation(program, `u_enableDirectLight`),
        scene.configs.enableDirectLight as any
      );
      gl.uniform1i(
        gl.getUniformLocation(program, `u_enableDiffuse`),
        scene.configs.enableDiffuse as any
      );
      gl.uniform1i(
        gl.getUniformLocation(program, `u_enableSpecular`),
        scene.configs.enableSpecular as any
      );
    }

    // uniform resolution
    {
      gl.uniform2f(
        gl.getUniformLocation(program, `u_resolution`),
        scene.camera.viewport.width,
        scene.camera.viewport.height
      );
    }

    // uniform light
    {
      const uniform = `u_lights`;
      scene.lights.forEach((light, i) => {
        const target = `${uniform}[${i}]`;
        gl.uniform3f(
          gl.getUniformLocation(program, `${target}.position`),
          ...(light.position.values as [number, number, number])
        );
        gl.uniform4f(
          gl.getUniformLocation(program, `${target}.diffuse`),
          light.diffuse.red,
          light.diffuse.green,
          light.diffuse.blue,
          1
        );
        gl.uniform4f(
          gl.getUniformLocation(program, `${target}.specular`),
          light.specular.red,
          light.specular.green,
          light.specular.blue,
          1
        );
      });
    }

    // uniform sphere
    {
      const uniform = `u_spheres`;
      scene.shapes.forEach((shape, i) => {
        const target = `${uniform}[${i}]`;
        gl.uniform3f(
          gl.getUniformLocation(program, `${target}.position`),
          ...(shape.position.values as [number, number, number])
        );
        gl.uniform1f(
          gl.getUniformLocation(program, `${target}.material.shininess`),
          shape.material.shininess
        );
        gl.uniform4f(
          gl.getUniformLocation(program, `${target}.material.ambient`),
          shape.material.ambient.red,
          shape.material.ambient.green,
          shape.material.ambient.blue,
          1
        );
        gl.uniform4f(
          gl.getUniformLocation(program, `${target}.material.diffuse`),
          shape.material.diffuse.red,
          shape.material.diffuse.green,
          shape.material.diffuse.blue,
          1
        );
        gl.uniform4f(
          gl.getUniformLocation(program, `${target}.material.specular`),
          shape.material.specular.red,
          shape.material.specular.green,
          shape.material.specular.blue,
          1
        );
        gl.uniform4f(
          gl.getUniformLocation(program, `${target}.material.reflectivity`),
          shape.material.reflectivity.red,
          shape.material.reflectivity.green,
          shape.material.reflectivity.blue,
          1
        );
        gl.uniform1f(
          gl.getUniformLocation(program, `${target}.radius`),
          (shape as Sphere).radius
        );
      });
    }

    // uniform camera
    {
      const target = `u_camera`;
      gl.uniform3f(
        gl.getUniformLocation(program, `${target}.position`),
        ...(scene.camera.position.values as [number, number, number])
      );
      gl.uniform3f(
        gl.getUniformLocation(program, `${target}.direction`),
        ...(scene.camera.direction.values as [number, number, number])
      );
      gl.uniform1f(
        gl.getUniformLocation(program, `${target}.viewport.width`),
        scene.camera.viewport.width
      );
      gl.uniform1f(
        gl.getUniformLocation(program, `${target}.viewport.height`),
        scene.camera.viewport.height
      );
      gl.uniform1f(
        gl.getUniformLocation(program, `${target}.viewport.depth`),
        scene.camera.viewport.depth
      );
    }

    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };
}

function getCanvasSize(
  gl: WebGL2RenderingContext
): { width: any; height: any } {
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

const gl = createWebGL2Context();
function createWebGL2Context() {
  const canvas = document.createElement("canvas");
  const gl = canvas.getContext("webgl2");
  if (!gl) throw new Error("WebGL2 context not supported");

  canvas.style.width = "100vw";
  canvas.style.height = "100vh";
  document.body.append(canvas);

  return gl;
}

const render = createRender(gl, vertexShaderSource, fragmentShaderSource);

// FPS meter
const stats = new Stats();
stats.showPanel(0);
document.body.appendChild(stats.dom);
const withStats = (fn: () => void) => {
  stats.begin();
  fn();
  stats.end();
};

const lastRenderedPosition = {
  x: -1,
  y: -1,
};
const position = {
  x: -1,
  y: -1,
};
if (gl.canvas instanceof HTMLElement) {
  gl.canvas.addEventListener("wheel", (e) => {
    scene.camera.zoom(e.deltaY * 0.05 * 0.0625);
  });

  gl.canvas.addEventListener("scroll", (e) => {
    e.stopPropagation();
    e.preventDefault();
  });

  gl.canvas.addEventListener("touchmove", (e) => {
    e.stopPropagation();
    e.preventDefault();
  });

  handlePointerEvents(gl.canvas, {
    onDragStart(x, y) {
      position.x = x;
      position.y = y;
      lastRenderedPosition.x = x;
      lastRenderedPosition.y = y;
    },
    onDragEnd(x, y) {},
    onDragging(x, y) {
      position.x = x;
      position.y = y;
    },
  });
}

const playControl = createPlayControl((playtime) =>
  withStats(() => {
    render();

    // move camera
    const { x, y } = position;
    if (lastRenderedPosition.x !== x || lastRenderedPosition.y !== y) {
      const { v, h } = onPointerMovementAngle(
        -x + lastRenderedPosition.x,
        y - lastRenderedPosition.y, // coordinate directions are opposite
        gl.canvas.width,
        gl.canvas.height
      );
      scene.camera.rotate(h, v);
      lastRenderedPosition.x = x;
      lastRenderedPosition.y = y;
    }

    // move lights
    const periodTime = 1000 * 60 * 100;
    const angle = ((playtime % periodTime) / periodTime) * 360;

    const aroundCenter = true;
    if (aroundCenter) {
      const tracks = [
        {
          center: new Position(0, 0, 0),
          distance: 1,
          light: scene.lights[0],
        },
        {
          center: new Position(0, 0, 0),
          distance: 2,
          light: scene.lights[1],
        },
        {
          center: new Position(0, 0, 0),
          distance: 1.5,
          light: scene.lights[2],
        },
      ];
      for (let i = 0; i < tracks.length; i++) {
        const { center, distance, light } = tracks[i];
        const $angle = angle * (i + 1) * 2;
        // rotate around x, y, z axis according to i
        [Math.sin($angle) * distance, Math.cos($angle) * distance, 0].forEach(
          (v, j) => {
            const k = (i + j) % 3;
            light.position.values[k] = center.values[k] + v;
          }
        );
      }
    } else {
      const amountOfTracks = Math.min(scene.lights.length, scene.shapes.length);
      for (let i = 0; i < amountOfTracks; i++) {
        const $angle = angle * (i + 1) * 2;
        const light = scene.lights[i];
        const sphere = scene.shapes[i];
        // rotate around x, y, z axis according to i
        if (sphere instanceof Sphere) {
          const distance = sphere.radius * 1.8;
          [Math.sin($angle) * distance, Math.cos($angle) * distance, 0].forEach(
            (v, j) => {
              const k = (i + j + 2) % 3;
              light.position.values[k] = sphere.position.values[k] + v;
            }
          );
        }
      }
    }
  })
);

playControl.play();

const camera = new Camera({
  position: new Position(-1, -1, 0),
  target: new Position(0, 0, 0),
  viewport: {
    width: 1,
    height: 1,
    depth: 1,
  },
});

const scene = new Scene(camera);
{
  const shapes = [
    new Sphere(
      new Position(4, 4, 0),
      2,
      new Material(
        Color.fromHex(0xaaaaaa),
        Color.fromHex(0x000000),
        Color.fromHex(0xcccccc),
        2,
        Color.fromHex(0xdddddd)
      )
    ),
    new Sphere(
      new Position(0, 3, 3),
      1,
      new Material(
        Color.fromHex(0xaaaaaa),
        Color.fromHex(0x000000),
        Color.fromHex(0xcccccc),
        2,
        Color.fromHex(0xdddddd)
      )
    ),
    new Sphere(
      new Position(2, 0, 2),
      1,
      new Material(
        Color.fromHex(0xaaaaaa),
        Color.fromHex(0x000000),
        Color.fromHex(0xcccccc),
        2,
        Color.fromHex(0xdddddd)
      )
    ),
  ];
  scene.shapes.push(...shapes);

  const lights = [
    new Light(
      Color.fromHex(0xcc0000),
      Color.fromHex(0xaaaaaa),
      new Position(0, 0, 0)
    ),
    new Light(
      Color.fromHex(0x00f0f0),
      Color.fromHex(0xaaaaaa),
      new Position(-4, 0, -2)
    ),
    new Light(
      Color.fromHex(0xffcc00),
      Color.fromHex(0xaaaaaa),
      new Position(-1.5, 0, 0)
    ),
  ];
  scene.lights.push(...lights);

  const ambient = Color.fromHex(0x000000);
  scene.ambient = ambient;
  const background = Color.fromHex(0x222222);
  scene.background = background;

  const g = new GUI();
  addTree(
    g,
    pick(scene, ["configs", "shapes", "lights", "ambient", "background"]),
    render
  );
}

function onPointerMovementAngle(
  x: number,
  y: number,
  width: number,
  height: number
) {
  const short = Math.min(width, height);
  const angles = {
    h: (x / short) * Math.PI * 2,
    v: (y / short) * Math.PI * 2,
  };

  return angles;
}

ReactDOM.render(
  React.createElement(PlayControl, { playControl }),
  document.querySelector("#controls")
);
