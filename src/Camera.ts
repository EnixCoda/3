import { Ray } from "./Ray";
import { Direction, Position } from "./Vector";

type Viewport = {
  width: number;
  height: number;
  depth: number;
};

export class Camera {
  distance: number;
  position: Position;
  direction: Direction;
  viewport: Viewport;

  constructor({
    distance,
    position,
    direction,
    target,
    viewport,
  }: {
    distance: Camera["distance"];
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
      }
  )) {
    this.distance = distance;
    this.position = position;
    this.viewport = viewport;
    if (direction) this.direction = direction;
    else if (target) this.direction = this.targetAt(target);
    else throw new Error(`No direction set`);
  }

  lookTo(direction: Direction) {
    this.direction = direction;
    return this.direction;
  }

  targetAt(target: Position) {
    this.direction = target.sub(this.position);
    return this.direction;
  }

  // rotate around the Z axis, vertically and horizontally to current viewport
  rotate(h: number, v: number) {
    const angleV = Math.asin(this.position.z / this.position.length);
    const angleH =
      Math.atan(this.position.y / this.position.x) +
      Math.PI * (this.position.x >= 0 ? 2 : 1);

    this.position.values = [
      Math.cos(angleH + h) * this.distance,
      Math.sin(angleH + h) * this.distance,
      Math.sin(angleV + v) * this.distance,
    ];
    this.targetAt(new Position(0, 0, 0));
  }

  rasterize(
    width: number,
    height: number,
    processor: (x: number, y: number, ray: Ray) => void
  ) {
    const [topLeft, topRight, bottomLeft, bottomRight] = this.getCorners();

    for (let x = 0; x < width; ++x) {
      const l = topLeft.scale(x).add(topRight.scale(width - x));
      const r = bottomLeft.scale(x).add(bottomRight.scale(width - x));
      for (let y = 0; y < height; ++y) {
        const ray = new Ray(this.position, r.scale(y).add(l.scale(height - y)));
        processor(x, y, ray);
      }
    }
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
