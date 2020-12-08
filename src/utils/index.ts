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

export function handleDragEvents(
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
  let dragging = false;
  target.addEventListener("pointerdown", (ev) => {
    const e = ev as PointerEvent;
    dragging = true;
    onDragStart(e.x, e.y);
  });

  target.addEventListener("pointerup", (ev) => {
    const e = ev as PointerEvent;
    dragging = false;
    onDragEnd(e.x, e.y);
  });

  target.addEventListener("pointermove", (ev) => {
    const e = ev as PointerEvent;
    if (dragging) onDragging(e.x, e.y);
  });
}
