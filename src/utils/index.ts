export function clamp(value: number, min: number, max: number) {
  return value < min ? min : value > max ? max : value;
}

export function pick(target: { [key: string]: any }, keys: string[]) {
  const copy: { [key: string]: any } = {};
  for (const key of keys) {
    copy[key] = target[key];
  }
  return copy;
}

export function recordDuration(label: string, fn: () => void) {
  return function () {
    console.time(label);
    fn();
    console.timeEnd(label);
  };
}

export function assert<T>(
  target: T | null,
  message?: string
): asserts target is T {
  if (target === null) throw new Error(message);
}

export function updateIfNotEqual<T, K extends keyof T>(
  target: T,
  property: K,
  value: T[K]
) {
  if (target[property] !== value) {
    target[property] = value;
  }
}

export function run<T>(fn: () => T): T {
  return fn();
}

function mapReader<K, V>(map: Map<K, V>, getDefaultValue: () => V) {
  return (key: K) => {
    if (!map.has(key)) {
      map.set(key, getDefaultValue());
    }
    const value = map.get(key);
    if (value === undefined) throw new Error();
    return value;
  };
}

export function handlePointerEvents(
  target: HTMLElement | Window | Document,
  {
    onDragStart,
    onDragEnd,
    onDragging,
  }: {
    onDragStart: (x: number, y: number) => void;
    onDragEnd: (x: number, y: number) => void;
    onDragging: (x: number, y: number) => void;
  }
) {
  const map = new Map<
    PointerEvent["pointerId"],
    { dragging: boolean; position: Pick<PointerEvent, "x" | "y"> }
  >();

  function getDragging() {
    return Array.from(map.values()).filter(({ dragging }) => dragging);
  }

  const read = mapReader(map, () => ({
    dragging: false,
    position: {
      x: 0,
      y: 0,
    },
  }));

  function extractData(ev: Event) {
    const { pointerId, x, y } = ev as PointerEvent;
    const state = read(pointerId);
    return { state, x, y };
  }

  target.addEventListener("pointerdown", (ev) => {
    const { x, y, state } = extractData(ev);
    state.dragging = true;
    state.position.x = x;
    state.position.y = y;
    switch (getDragging().length) {
      case 1:
        onDragStart(x, y);
        break;
    }
  });

  target.addEventListener("pointerup", (ev) => {
    const { x, y, state } = extractData(ev);
    state.dragging = false;
    switch (getDragging().length) {
      case 0:
        onDragEnd(x, y);
        break;
    }
  });

  target.addEventListener("pointermove", (ev) => {
    const { x, y, state } = extractData(ev);
    state.position.x = x;
    state.position.y = y;
    switch (getDragging().length) {
      case 1:
        if (state.dragging) onDragging(x, y);
        break;
    }
  });
}
