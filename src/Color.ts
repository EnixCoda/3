import { clamp } from "./utils";

export class Color {
  static fromHex(hex: number) {
    return new Color(
      ((hex >> 16) & 0xff) / 0xff,
      ((hex >> 8) & 0xff) / 0xff,
      ((hex >> 0) & 0xff) / 0xff
    );
  }

  red: number;
  green: number;
  blue: number;

  constructor(red: Color["red"], green: Color["green"], blue: Color["blue"]) {
    this.red = red;
    this.green = green;
    this.blue = blue;
  }

  toHex() {
    return (
      0 +
      (((clamp(this.red, 0, 1) * 0xff) >> 0) << 16) +
      (((clamp(this.green, 0, 1) * 0xff) >> 0) << 8) +
      ((clamp(this.blue, 0, 1) * 0xff) >> 0)
    );
  }

  toHexString() {
    return `#${this.toHex().toString(16).padStart(6, "0")}`;
  }

  tune(ratio: number, clone = true) {
    const result = clone ? new Color(this.red, this.green, this.blue) : this;
    result.red *= ratio;
    result.green *= ratio;
    result.blue *= ratio;
    return result;
  }

  mix(color: Color, clone = true) {
    const result = clone ? new Color(this.red, this.green, this.blue) : this;
    result.red *= color.red;
    result.green *= color.green;
    result.blue *= color.blue;
    return result;
  }

  overlay(color: Color, clone = true) {
    const result = clone ? new Color(this.red, this.green, this.blue) : this;
    result.red += color.red;
    result.green += color.green;
    result.blue += color.blue;
    return result;
  }
}
