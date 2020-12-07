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
