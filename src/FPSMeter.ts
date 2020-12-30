import Stats from "stats.js";

const stats = new Stats();

let enabled = false;
function enable() {
  enabled = true;
  stats.showPanel(0);
  document.body.appendChild(stats.dom);
}

export const withFPS = (fn: () => void) => {
  if (!enabled) enable();
  stats.begin();
  fn();
  stats.end();
};
