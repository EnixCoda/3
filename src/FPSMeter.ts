import Stats from "stats.js";

// FPS meter
const stats = new Stats();
stats.showPanel(0);
document.body.appendChild(stats.dom);
export const withFPS = (fn: () => void) => {
  stats.begin();
  fn();
  stats.end();
};
