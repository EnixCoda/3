import { Color } from "./Color";

type Ambient = Color;

export class Material {
  shininess: number;
  ambient: Ambient;
  diffuse: Color;
  specular: Color;
  reflectivity: Color;

  constructor(
    ambient: Material["ambient"],
    diffuse: Material["diffuse"],
    specular: Material["specular"],
    shininess: Material["shininess"],
    reflectivity: Material["reflectivity"]
  ) {
    this.ambient = ambient;
    this.diffuse = diffuse;
    this.specular = specular;
    this.shininess = shininess;
    this.reflectivity = reflectivity;
  }
}
