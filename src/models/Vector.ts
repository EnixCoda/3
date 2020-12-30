export class Vector {
  values: number[] = [];

  constructor(values?: Vector["values"]) {
    if (values) this.values.push(...values);
  }

  cloneSelf = () => new Vector(this.values);

  get length(): number {
    return Math.sqrt(this.dotProduct(this));
  }

  private linearOperate<V extends Vector>(
    vector: V,
    scale: number,
    clone: boolean
  ): V {
    const result = clone ? this.cloneSelf() : this;
    for (let i = 0; i < this.values.length; i++) {
      result.values[i] += vector.values[i] * scale;
    }
    return result as V;
  }

  add<V extends Vector>(vector: V, clone = true) {
    return this.linearOperate(vector, 1, clone);
  }

  sub<V extends Vector>(vector: V, clone = true) {
    return this.linearOperate(vector, -1, clone);
  }

  scale(ratio: number, clone = true): Vector {
    const result = clone ? this.cloneSelf() : this;
    for (let i = 0; i < this.values.length; i++) {
      result.values[i] *= ratio;
    }
    return result;
  }

  dotProduct(vector: Vector) {
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

export class Vector3D extends Vector {
  constructor(x: number, y: number, z: number) {
    super([x, y, z]);
  }

  cloneSelf = () => new Vector3D(this.x, this.y, this.z);

  get x() {
    return this.values[0];
  }

  get y() {
    return this.values[1];
  }

  get z() {
    return this.values[2];
  }

  get xyz() {
    return [this.x, this.y, this.z] as [number, number, number];
  }
}

export class Position extends Vector3D {
  cloneSelf = () => new Position(this.x, this.y, this.z);

  static from(vector: Vector) {
    const [x, y, z] = vector.values;
    return new Position(x, y, z);
  }
}

export class Direction extends Vector3D {
  cloneSelf = () => new Direction(this.x, this.y, this.z);

  static from(vector: Vector) {
    const [x, y, z] = vector.values;
    return new Direction(x, y, z);
  }
}
