import { GUI } from "dat.gui";
import { Color } from "../Color";
import { Light } from "../Lights";
import { Material } from "../Material";
import { Sphere } from "../Shapes";
import { Direction, Position, Vector } from "../Vector";

function addColor(g: GUI, target: Color, name: string, onChange: () => void) {
  return g
    .addColor(
      {
        [name]: target.toHexString(),
      },
      name
    )
    .onChange((value) => {
      const newColor = Color.fromHex(parseInt(value.slice(1), 16));
      target.red = newColor.red;
      target.green = newColor.green;
      target.blue = newColor.blue;
      onChange();
    });
}

function addVector(
  g: GUI,
  target: Position | Direction,
  name: string,
  onChange: () => void
) {
  const names = ["x", "y", "z"];
  const dummy: { [key in typeof names[number]]: number } = {};
  target.values.forEach((value, index) => {
    dummy[names[index]] = value;
  });
  const f = g.addFolder(name);
  for (const name of names) {
    f.add(dummy, name, -10, 10, 0.5).onChange((value) => {
      target.values[names.indexOf(name)] = value;
      onChange();
    });
  }
  return f;
}

function add(g: GUI, target: any, property: string, onChange: () => void) {
  const type: "color" | "number" | "vector" | "default" =
    target[property] instanceof Color
      ? "color"
      : target[property] instanceof Vector
      ? "vector"
      : "default";
  switch (type) {
    case "color":
      return addColor(g, target[property], property, onChange);
    case "vector":
      return addVector(g, target[property], property, onChange);
    case "default":
      return g.add(target, property).onChange(onChange);
  }
}

export function addTree(
  g: GUI,
  target: { [key: string]: any },
  onChange: () => void,
  keys = Object.keys(target)
) {
  keys.forEach((key) => {
    const value = target[key];
    if (typeof value === "object") {
      if (value instanceof Vector) {
        addVector(g, value, key, onChange);
      } else if (value instanceof Color) {
        addColor(g, value, key, onChange);
      } else {
        const keys =
          value instanceof Material
            ? ["ambient", "diffuse", "specular", "reflectivity", "shininess"]
            : value instanceof Sphere
            ? ["material", "position", "radius"]
            : value instanceof Light
            ? ["specular", "diffuse"]
            : Object.keys(value);
        addTree(g.addFolder(key), value, onChange, keys);
      }
    } else {
      add(g, target, key, onChange);
    }
  });
}
