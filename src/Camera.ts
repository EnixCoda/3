import { Position, Direction } from "./Vector";
import { Ray } from "./Ray";

type Viewport = {
  width: number;
  height: number;
  depth: number;
};

export class Camera {
  position: Position;
  direction: Direction;
  viewport: Viewport;

  constructor({
    position,
    direction,
    target,
    viewport
  }: {
    position: Camera["position"];
    viewport: Viewport;
  } & (
    | {
        direction: Camera["direction"];
        target?: undefined;
      }
    | {
        direction?: undefined;
        target: Position;
      })) {
    this.position = position;
    this.viewport = viewport;
    if (direction) this.direction = direction;
    else if (target) this.direction = this.targetAt(target);
    else throw new Error(`No direction set`);

    this.getCorners();
  }

  lookTo(direction: Direction) {
    this.direction = direction;
    return this.direction;
  }

  targetAt(target: Position) {
    this.direction = target.sub(this.position);
    return this.direction;
  }

  rasterize(
    width: number,
    height: number,
    processor: (x: number, y: number, ray: Ray) => void
  ) {
    // safe to ignore bottom right as viewport is rectangle
    const [topLeft, topRight, bottomLeft, bottomRight] = this.getCorners();
    const horizon = topRight.sub(topLeft).scale(1 / width);
    const verti = bottomLeft.sub(topLeft).scale(1 / height);
    const init = topLeft.sub(this.position);

    const ray = new Ray(this.position, init);
    for (let x = 0; x < width; ++x) {
      for (let y = 0; y < height; ++y) {
        processor(x, y, ray);
        ray.direction.add(verti, false);
      }
      ray.direction.add(topLeft.sub(bottomLeft), false);

      ray.direction.add(horizon, false);
    }
    return;
  }

  private getCorners() {
    const { width, height, depth } = this.viewport;
    const [xd, yd, zd] = this.direction.values;
    const horizontal = (yd || xd
      ? new Direction(-yd, xd, 0)
      : new Direction(zd, 0, 0)
    )
      .normalize()
      .scale(width);
    const vertical = (yd || xd
      ? new Direction(xd * zd, yd * zd, (xd * xd + yd * yd) * -1)
      : new Direction(0, -zd, 0)
    )
      .normalize()
      .scale(height);

    const baseDirection = this.direction.normalize().scale(depth);
    const results: Direction[] = [];
    for (const dv of [-1, 1]) {
      for (const dh of [-1, 1]) {
        results.push(
          baseDirection.add(horizontal.scale(dh)).add(vertical.scale(dv))
        );
      }
    }
    return results;
  }
}
