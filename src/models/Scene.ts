import { Camera } from "./Camera";
import { Color } from "./Color";
import { Light } from "./Light";
import { Ray } from "./Ray";
import { Shape } from "./Shapes";
import { Direction } from "./Vector";

export class Scene {
  camera: Camera;
  lights: Light[] = [];
  shapes: Shape[] = [];
  ambient: Color = Color.fromHex(0x000000);
  background: Color = Color.fromHex(0x000000);

  configs = {
    maxTraceTimes: 6,
    castRange: 0.7,
    enableDirectLight: true,
    enableDiffuse: true,
    enableSpecular: true,
    enableRefraction: true,
    refraction: 0.75,
  };

  constructor(camera: Camera) {
    this.camera = camera;
  }

  shade(ray: Ray, depth = 0) {
    const { camera, background, shapes, ambient, lights } = this;
    if (depth >= this.configs.maxTraceTimes) return Color.fromHex(0x000000);

    const closest = getClosestIntersect(ray, shapes);
    if (closest === undefined)
      return depth === 0 ? background : Color.fromHex(0x000000);
    const { shape, t } = closest;
    const p = ray.reach(t);

    let color = shape.material.ambient.mix(ambient);

    const n: Direction = Direction.from(p.sub(shape.position).normalize());
    for (const light of lights) {
      // shadow
      {
        const closest = getClosestIntersect(
          new Ray(light.position, p.sub(light.position)),
          shapes
        );
        // no light or the ray from light is blocked by other shapes?
        if (!closest || closest.shape !== shape) continue;
      }

      {
        const l: Direction = Direction.from(light.position.sub(p).normalize());
        const nl = n.dotProduct(l);
        if (nl <= 0) {
          // light is incoming from back
          continue;
        }

        // diffuse
        {
          const diffuse = shape.material.diffuse.mix(light.specular).tune(nl);
          color = color.overlay(diffuse);
        }

        // specular
        {
          const r = n.scale(2 * nl).sub(l);
          const v = camera.position.sub(p).normalize();
          const vr = v.dotProduct(r);
          if (vr > 0) {
            const specular = light.specular
              .mix(shape.material.specular)
              .tune(Math.pow(vr, shape.material.shininess));
            color = color.overlay(specular);
          }
        }
      }
    }

    // reflect
    {
      const l: Direction = Direction.from(ray.direction.normalize().scale(-1));
      const r = n.scale(2 * n.dotProduct(l)).sub(l);
      const reflected = this.shade(new Ray(p, r), depth + 1);
      if (reflected !== background) color = color.overlay(reflected);
    }

    return color;
  }

  render(
    width: number,
    height: number,
    strokePixel: (x: number, y: number, color: Color) => void
  ) {
    this.camera.rasterize(width, height, (x, y, ray) => {
      strokePixel(x, y, this.shade(ray));
    });
  }
}

function getClosestIntersect(ray: Ray, shapes: Shape[]) {
  let t = Infinity,
    shape: Shape | undefined;
  for (const $shape of shapes) {
    const $t = $shape.intersect(ray);
    if ($t !== undefined) {
      if ($t < t) {
        t = $t;
        shape = $shape;
      }
    }
  }
  if (shape) return { t, shape };
}
