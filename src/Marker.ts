abstract class Marker<T> {
  abstract lastMark: T;
  abstract latestMark: T;
  sync() {
    this.lastMark = this.latestMark;
  }
  mark(t: T) {
    this.latestMark = t;
  }
  abstract delta(): T;
}
export class Marker1D extends Marker<number> {
  lastMark = 0;
  latestMark = 0;

  delta() {
    return this.lastMark - this.latestMark;
  }
}
export class Marker2D extends Marker<{ x: number; y: number }> {
  lastMark = { x: 0, y: 0 };
  latestMark = { x: 0, y: 0 };

  delta() {
    return {
      x: this.lastMark.x - this.latestMark.x,
      y: this.lastMark.y - this.latestMark.y,
    };
  }
}
