export class Vector<V = any> {
  values: number[] = [];

  get length(): number {
    return Math.sqrt(this.dotProduct(this));
  }

  get x() {
    return this.values[0];
  }

  get y() {
    return this.values[1];
  }

  get z() {
    return this.values[2];
  }

  constructor(values?: Vector["values"]) {
    if (values) for (const value of values) this.values.push(value);
  }

  private linearOperate(vector: Vector<V>, scale: number, clone: boolean) {
    const result = clone ? new Vector<V>(this.values) : this;
    for (let i = 0; i < this.values.length; i++) {
      result.values[i] += vector.values[i] * scale;
    }
    return result;
  }

  add(vector: Vector<V>, clone = true) {
    return this.linearOperate(vector, 1, clone);
  }

  sub(vector: Vector<V>, clone = true) {
    return this.linearOperate(vector, -1, clone);
  }

  scale(ratio: number, clone = true) {
    const result = clone ? new Vector<V>(this.values) : this;
    for (let i = 0; i < this.values.length; i++) {
      result.values[i] *= ratio;
    }
    return result;
  }

  dotProduct(vector: Vector<V>) {
    let result = 0;
    for (let i = 0; i < this.values.length; i++) {
      result += this.values[i] * vector.values[i];
    }
    return result;
  }

  normalize(clone = true) {
    const length = this.length;
    if (length === 0) throw new Error(`No unit`);
    return this.scale(1 / length, clone);
  }
}

class Vector3D extends Vector<Vector3D> {
  constructor(x: number, y: number, z: number) {
    super([x, y, z]);
  }
}

export class Position extends Vector3D {}

export class Direction extends Vector3D {}
