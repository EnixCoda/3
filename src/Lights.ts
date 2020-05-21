import { Position } from "./Vector";
import { Color } from "./Color";

export class Light {
  position: Position;
  diffuse: Color;
  specular: Color;

  constructor(
    specular: Light["specular"],
    diffuss: Light["diffuse"],
    position: Light["position"]
  ) {
    this.specular = specular;
    this.diffuse = diffuss;
    this.position = position;
  }
}
