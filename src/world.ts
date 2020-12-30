import { Camera } from "./models/Camera";
import { Color } from "./models/Color";
import { Light } from "./models/Light";
import { Material } from "./models/Material";
import { Scene } from "./models/Scene";
import { Sphere } from "./models/Shapes";
import { Position } from "./models/Vector";

const camera = new Camera({
  position: new Position(-1, -1, 0),
  target: new Position(0, 0, 0),
  viewport: {
    width: 1,
    height: 1,
    depth: 1,
  },
});

export const scene = new Scene(camera);

const shapes = [
  new Sphere(
    new Position(4, 4, 0),
    2,
    new Material(
      Color.fromHex(0x444444),
      Color.fromHex(0x000000),
      Color.fromHex(0xcccccc),
      2,
      Color.fromHex(0xdddddd)
    )
  ),
  new Sphere(
    new Position(0, 3, 3),
    1,
    new Material(
      Color.fromHex(0x444444),
      Color.fromHex(0x000000),
      Color.fromHex(0xcccccc),
      2,
      Color.fromHex(0xdddddd)
    )
  ),
  new Sphere(
    new Position(2, 0, 2),
    1,
    new Material(
      Color.fromHex(0x444444),
      Color.fromHex(0x000000),
      Color.fromHex(0xcccccc),
      2,
      Color.fromHex(0xdddddd)
    )
  ),
];
scene.shapes.push(...shapes);

const lights = [
  new Light(
    Color.fromHex(0xcc0000),
    Color.fromHex(0xaaaaaa),
    new Position(0, 0, 0)
  ),
  new Light(
    Color.fromHex(0x00f0f0),
    Color.fromHex(0xaaaaaa),
    new Position(-4, 0, -2)
  ),
  new Light(
    Color.fromHex(0xffcc00),
    Color.fromHex(0xaaaaaa),
    new Position(-1.5, 0, 0)
  ),
];
scene.lights.push(...lights);

const ambient = Color.fromHex(0x444444);
scene.ambient = ambient;
const background = Color.fromHex(0x111111);
scene.background = background;
