import React from "react";
import ReactDOM from "react-dom";
import { withFPS } from "./FPSMeter";
import { Marker1D, Marker2D } from "./Marker";
import { Light } from "./models/Light";
import { Sphere } from "./models/Shapes";
import { Position } from "./models/Vector";
import { createPlayControl, PlayControl } from "./playControl";
import fragmentShaderSource from "./shaders/fragment.glsl";
import vertexShaderSource from "./shaders/vertex.glsl";
import { handlePointerEvents, updateIfNotEqual } from "./utils";
import { transform, uniform } from "./utils/v";
import { mountVariantsControl } from "./variantsControl";
import { createRender, createWebGL2Context, getCanvasSize } from "./webgl2";
import { scene } from "./world";

const gl = createWebGL2Context();

function setupState(gl: WebGL2RenderingContext, program: WebGLProgram) {
  const { width, height } = getCanvasSize(gl);

  updateIfNotEqual(gl, "canvas", { width, height });

  uniform.vec4().bind(gl, program, `u_ambient`).feed(scene.ambient.rgb);
  uniform.vec4().bind(gl, program, `u_background`).feed(scene.background.rgb);

  // config uniforms
  uniform
    .int()
    .bind(gl, program, `u_maxReflectTimes`)
    .feed(scene.configs.maxReflectTimes);

  uniform
    .float()
    .bind(gl, program, `u_castRange`)
    .feed(scene.configs.castRange);

  uniform
    .bool()
    .bind(gl, program, `u_enableDirectLight`)
    .feed(scene.configs.enableDirectLight);

  uniform
    .bool()
    .bind(gl, program, `u_enableDiffuse`)
    .feed(scene.configs.enableDiffuse);

  uniform
    .bool()
    .bind(gl, program, `u_enableSpecular`)
    .feed(scene.configs.enableSpecular);

  // uniform resolution
  uniform
    .vec2()
    .bind(gl, program, `u_resolution`)
    .feed([scene.camera.viewport.width, scene.camera.viewport.height]);

  // uniform light
  scene.lights.forEach((light, i) => {
    uniform
      .struct<Light>({
        position: "vec3",
        diffuse: "vec4",
        specular: "vec4",
      })
      .bind(gl, program, `${`u_lights`}[${i}]`)
      .feed(
        transform(light, {
          position: (v) => v.xyz,
          diffuse: (v) => v.rgb,
          specular: (v) => v.rgb,
        })
      );
  });

  // uniform sphere
  scene.shapes.forEach((shape, i) => {
    uniform
      .struct({
        position: "vec3",
        material: {
          shininess: "float",
          ambient: "vec4",
          diffuse: "vec4",
          specular: "vec4",
          reflectivity: "vec4",
        },
        radius: "float",
      })
      .bind(gl, program, `${`u_spheres`}[${i}]`)
      .feed(
        transform(shape, {
          position: (v) => v.xyz,
          material: {
            ambient: (v) => v.rgb,
            diffuse: (v) => v.rgb,
            specular: (v) => v.rgb,
            reflectivity: (v) => v.rgb,
          },
        })
      );
  });

  // uniform camera
  updateIfNotEqual(scene.camera, "viewport", {
    width,
    height,
    depth: Math.min(width, height) * 3,
  });
  uniform
    .struct({
      position: "vec3",
      direction: "vec3",
      viewport: {
        width: "float",
        height: "float",
        depth: "float",
      },
    })
    .bind(gl, program, `u_camera`)
    .feed(
      transform(scene.camera, {
        position: (v) => v.xyz,
        direction: (value) => value.xyz,
      })
    );
}

export const render = createRender(
  gl,
  vertexShaderSource,
  fragmentShaderSource,
  setupState
);

const cameraDistanceMarker = new Marker1D();
const cameraPositionMarker = new Marker2D();

if (gl.canvas instanceof HTMLElement) {
  gl.canvas.style.width = "100vw";
  gl.canvas.style.height = "100vh";

  gl.canvas.addEventListener("wheel", (e) => {
    cameraDistanceMarker.mark(e.deltaY);
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
      cameraPositionMarker.mark({ x, y: -y });
      cameraPositionMarker.sync();
    },
    onDragEnd(x, y) {},
    onDragging(x, y) {
      cameraPositionMarker.mark({ x, y: -y });
    },
  });
}

function updateWithControls() {
  // zoom camera
  {
    const delta = cameraDistanceMarker.delta();
    if (delta) {
      scene.camera.zoom(delta / 512);
      cameraDistanceMarker.mark(0);
      cameraDistanceMarker.sync();
    }
  }
  // rotate camera
  {
    const delta = cameraPositionMarker.delta();
    if (delta.x || delta.y) {
      const { v, h } = onPointerMovementAngle(
        delta.x,
        delta.y,
        gl.canvas.width,
        gl.canvas.height
      );
      scene.camera.rotate(h, v);
      cameraPositionMarker.sync();
    }
  }
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

const playControl = createPlayControl((playtime) =>
  withFPS(() => {
    render();

    updateWithControls();

    // move lights
    const periodTime = 1000 * 60 * 60;
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

ReactDOM.render(
  React.createElement(PlayControl, { playControl }),
  document.querySelector("#controls")
);

playControl.play();

mountVariantsControl(render);
