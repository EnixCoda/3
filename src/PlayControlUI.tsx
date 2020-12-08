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
  const playtime = useRAFState(() =>
    new Date(playControl.getPlaytime() + startTime).toLocaleTimeString()
  );
  return (
    <div
      style={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        background: "#333",
        color: "#ddd",
        width: 150,
        padding: "8px 12px",
        borderRadius: 4,
      }}
    >
      <div style={{ display: "inline-flex", justifyContent: "space-between" }}>
        <span>{playtime}</span>
      </div>
      <div style={{ display: "inline-flex", justifyContent: "space-between" }}>
        <button onClick={() => playControl.back()}>⏪</button>
        <button onClick={() => playControl.toggle()}>⏯</button>
        <button onClick={() => playControl.forward()}>⏩</button>
      </div>
    </div>
  );
}
