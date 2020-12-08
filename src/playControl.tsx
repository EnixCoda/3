import * as React from "react";
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

export function createPlayControl(fn: (playtime: number) => void) {
  let playing = false;

  let lastProgress = 0;
  let lastRecordTime = 0;
  let playSpeed = 1;
  let playForward = true;
  function loop() {
    requestAnimationFrame(() => {
      if (playing) {
        fn(getPlaytime());
        loop();
      }
    });
  }

  function play() {
    if (!playing) loop();
    playing = true;
    lastRecordTime = +Date.now();
  }

  function getPlaytime() {
    if (playing)
      return (
        lastProgress +
        (+Date.now() - lastRecordTime) * playSpeed * (playForward ? 1 : -1)
      );
    return lastProgress;
  }

  function recordTimes() {
    lastProgress = getPlaytime();
    lastRecordTime = +Date.now();
  }

  function pause() {
    recordTimes();
    playing = false;
  }

  function toggle() {
    if (playing) pause();
    else play();
  }

  function tunePlaySpeed(faster: boolean) {
    if (faster) {
      if (playSpeed < 32) playSpeed *= 2;
    } else playSpeed *= 0.5;
  }

  function back() {
    recordTimes();
    if (playForward === true && playSpeed === 1) {
      playForward = false;
    } else tunePlaySpeed(playForward === false);
  }

  function forward() {
    recordTimes();
    if (playForward === false && playSpeed === 1) {
      playForward = true;
    } else tunePlaySpeed(playForward === true);
  }

  return {
    play,
    pause,
    toggle,
    back,
    forward,
    getPlaytime,
    getPlaySpeed() {
      return playSpeed * (playForward ? 1 : -1);
    },
  };
}
