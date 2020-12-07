import * as React from "react";
import { createPlayControl } from "./playControl";
import { run } from "./utils";

type Props = {
  playControl: ReturnType<typeof createPlayControl>;
};

function useRAF(cb: () => void) {
  React.useEffect(() => {
    run(function r() {
      requestAnimationFrame(() => {
        cb();
        r();
      });
    });
  }, []);
}

function useRAFState<T>(cb: () => T) {
  const [state, setState] = React.useState(cb);
  useRAF(() => {
    setState(cb());
  });
  return state;
}

const startTime = +Date.now();
export function PlayControl({ playControl }: React.PropsWithChildren<Props>) {
  const playSpeed = useRAFState(() => playControl.getPlaySpeed().toString());
  const playtime = useRAFState(() =>
    new Date(playControl.getPlaytime() + startTime).toLocaleTimeString()
  );
  return (
    <div style={{ display: "inline-flex", background: "#333", color: "#ddd" }}>
      <button onClick={() => playControl.back()}>⏪</button>
      <button onClick={() => playControl.toggle()}>⏯</button>
      <button onClick={() => playControl.forward()}>⏩</button>
      <span>✕{playSpeed}</span>
      <span>{" - "}</span>
      <span>{playtime}</span>
    </div>
  );
}
