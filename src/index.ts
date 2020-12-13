import React from "react";
import ReactDOM from "react-dom";
import { withFPS } from "./FPSMeter";
import { Marker1D, Marker2D } from "./Marker";
import { createPlayControl, PlayControl } from "./playControl";
import fragmentShaderSource from "./shaders/fragment.glsl";
import vertexShaderSource from "./shaders/vertex.glsl";
import { Sphere } from "./Shapes";
import { handlePointerEvents, updateIfNotEqual } from "./utils";
import { mountVariantsControl } from "./variantsControl";
import { Position } from "./Vector";
import { createRender, createWebGL2Context, getCanvasSize } from "./webgl2";
import { scene } from "./world";

const gl = createWebGL2Context();

function setupState(gl: WebGL2RenderingContext, program: WebGLProgram) {
  const { width, height } = getCanvasSize(gl);

  updateIfNotEqual(gl, "canvas", { width, height });
  updateIfNotEqual(scene.camera, "viewport", {
    width,
    height,
    depth: Math.min(width, height) * 3,
  });

  // uniform ambient
  {
    gl.uniform4f(
      gl.getUniformLocation(program, `u_ambient`),
      ...scene.ambient.rgb,
      1
    );
  }

  // uniform background
  {
    gl.uniform4f(
      gl.getUniformLocation(program, `u_background`),
      ...scene.background.rgb,
      1
    );
  }

  // config uniforms
  {
    gl.uniform1i(
      gl.getUniformLocation(program, `u_maxReflectTimes`),
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
        ...light.position.xyz
      );
      gl.uniform4f(
        gl.getUniformLocation(program, `${target}.diffuse`),
        ...light.diffuse.rgb,
        1
      );
      gl.uniform4f(
        gl.getUniformLocation(program, `${target}.specular`),
        ...light.specular.rgb,
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
        ...shape.position.xyz
      );
      gl.uniform1f(
        gl.getUniformLocation(program, `${target}.material.shininess`),
        shape.material.shininess
      );
      gl.uniform4f(
        gl.getUniformLocation(program, `${target}.material.ambient`),
        ...shape.material.ambient.rgb,
        1
      );
      gl.uniform4f(
        gl.getUniformLocation(program, `${target}.material.diffuse`),
        ...shape.material.diffuse.rgb,
        1
      );
      gl.uniform4f(
        gl.getUniformLocation(program, `${target}.material.specular`),
        ...shape.material.specular.rgb,
        1
      );
      gl.uniform4f(
        gl.getUniformLocation(program, `${target}.material.reflectivity`),
        ...shape.material.reflectivity.rgb,
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
      ...scene.camera.position.xyz
    );
    gl.uniform3f(
      gl.getUniformLocation(program, `${target}.direction`),
      ...scene.camera.direction.xyz
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
