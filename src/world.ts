import { Camera } from "./Camera";
import { Color } from "./Color";
import { Light } from "./Lights";
import { Material } from "./Material";
import { Scene } from "./Scene";
import { Sphere } from "./Shapes";
import { Position } from "./Vector";

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
