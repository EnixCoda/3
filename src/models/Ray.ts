import { Position, Direction } from "./Vector";

export class Ray {
  position: Position;
  direction: Direction;

  constructor(position: Ray["position"], direction: Ray["direction"]) {
    this.position = position;
    this.direction = direction;
  }

  reach(ratio: number): Position {
    return this.position.add(this.direction.scale(ratio));
  }
}
