import { GUI } from "dat.gui";
import { pick } from "./utils";
import { addTree } from "./utils/gui.add";
import { scene } from "./world";

export function mountVariantsControl(onChange: () => void) {
  const g = new GUI();
  addTree(
    g,
    pick(scene, ["configs", "shapes", "lights", "ambient", "background"]),
    onChange
  );
}
