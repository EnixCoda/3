import { Position } from "./Vector";
import { Camera } from "./Camera";
import { Sphere } from "./Shapes";
import { Light } from "./Lights";
import { Color } from "./Color";
import { Material } from "./Material";
import { GUI } from "dat.gui";
import { Scene } from "./Scene";
import { addTree } from "./gui.add";
import { pick } from "./utils";

const render = recordDuration(`render a frame`, function render() {
  console.log(`rendering`);
  const imageData = context.createImageData(width, height);
  scene.render(width, height, function strokePixel(x, y, color) {
    const offset = (y * width + x) << 2;
    imageData.data[offset + 0] = color.red * 0xff;
    imageData.data[offset + 1] = color.green * 0xff;
    imageData.data[offset + 2] = color.blue * 0xff;
    imageData.data[offset + 3] = 0xff;
  });
  context.putImageData(imageData, 0, 0);
});

function recordDuration(label: string, fn: () => void) {
  return function() {
    console.time(label);
    fn();
    console.timeEnd(label);
  };
}

const dpr = window.devicePixelRatio;
const scale = 100;
const width = 4 * scale * dpr;
const height = 3 * scale * dpr;

const { context } = create2DContext(width, height);
function create2DContext(width: number, height: number) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) throw new Error("2D context not supported");

  const ratio = window.devicePixelRatio;
  canvas.width = width;
  canvas.height = height;
  canvas.style.width = width / ratio + "px";
  canvas.style.height = height / ratio + "px";
  canvas.style.boxShadow = "0 0 1px";
  document.body.append(canvas);

  return { canvas, context };
}

const camera = new Camera({
  position: new Position(-2, -2, -2),
  target: new Position(0, 0, 0),
  viewport: {
    width: 4,
    height: 3,
    depth: 5
  }
});

const scene = new Scene(camera);

const shapes = [
  new Sphere(
    new Position(2, 0, 0),
    1,
    new Material(
      Color.fromHex(0xffffff),
      Color.fromHex(0xff0000),
      Color.fromHex(0xff0000),
      2,
      Color.fromHex(0xffffff)
    )
  ),
  new Sphere(
    new Position(0, 2, 0),
    1,
    new Material(
      Color.fromHex(0xffffff),
      Color.fromHex(0x00ff00),
      Color.fromHex(0x00ff00),
      2,
      Color.fromHex(0xffffff)
    )
  ),
  new Sphere(
    new Position(0, 0, 2),
    1,
    new Material(
      Color.fromHex(0xffffff),
      Color.fromHex(0x0000ff),
      Color.fromHex(0x0000ff),
      2,
      Color.fromHex(0xffffff)
    )
  )
];
scene.shapes.push(...shapes);

const lights = [
  new Light(
    Color.fromHex(0xffffff),
    Color.fromHex(0xaaaaaa),
    new Position(-1, -1, -1)
  ),
  new Light(
    Color.fromHex(0xaaaaaa),
    Color.fromHex(0xaaaaaa),
    new Position(1, 1, 1)
  )
];
scene.lights.push(...lights);

const ambient = Color.fromHex(0x111111);
scene.ambient = ambient;
const background = Color.fromHex(0x222222);
scene.background = background;

const g = new GUI();
addTree(
  g,
  pick(scene, [
    "configs",
    "camera",
    "shapes",
    "lights",
    "ambient",
    "background"
  ]),
  render
);

render();
