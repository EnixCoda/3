import { Material } from "./Material";
import { Ray } from "./Ray";
import { Position } from "./Vector";

export abstract class Shape {
  abstract position: Position;
  abstract material: Material;
  abstract intersect(ray: Ray): number | undefined;
  abstract intersectPosition(ray: Ray): Position | undefined;
}

export class Sphere implements Shape {
  position: Position;
  material: Material;
  radius: number;

  constructor(
    position: Sphere["position"],
    radius: Sphere["radius"],
    material: Sphere["material"]
  ) {
    this.position = position;
    this.radius = radius;
    this.material = material;
  }

  intersectPosition(ray: Ray): Position | undefined {
    const min = this.intersect(ray);
    return min === undefined
      ? min
      : Position.from(ray.position.add(ray.direction.scale(min)));
  }

  intersect(ray: Ray): number | undefined {
    const c = ray.position.sub(this.position);
    const ts = solveQuadraticEquation(
      ray.direction.dotProduct(ray.direction),
      2 * c.dotProduct(ray.direction),
      c.dotProduct(c) - this.radius * this.radius
    );

    const [t1 = -Infinity, t2 = -Infinity] = ts;

    const min = t1 < t2 ? t1 : t2; // pick the closest to camera
    if (min > 0) return min;
  }
}

function solveQuadraticEquation(a: number, b: number, c: number) {
  const results: number[] = [];
  if (a === 0) {
    if (b === 0) {
      if (c === 0) {
        // result is all real numbers
      } else {
        // no results
      }
    } else {
      results.push(-c / b);
    }
  } else {
    const inDelta = b * b - 4 * a * c;
    if (inDelta === 0) {
      results.push((b * -1) / 2 / a);
    } else if (inDelta > 0) {
      const delta = Math.sqrt(inDelta);
      results.push((b * -1 + delta) / 2 / a);
      results.push((b * -1 - delta) / 2 / a);
    }
  }
  return results;
}
