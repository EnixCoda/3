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
