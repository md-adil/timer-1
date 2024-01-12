import {
  setTimeout as wait,
  setInterval as interval,
} from "node:timers/promises";

export function timer<X, T extends unknown[]>(
  cb: (out: X, ...params: T) => void,
  speed: (controller: AbortController) => AsyncIterable<X>
) {
  let controller: AbortController;
  let isStarted = false;
  async function start(...params: T) {
    isStarted = true;
    controller = new AbortController();
    for await (const _ of speed(controller)) {
      if (!isStarted) break;
      cb(_, ...params);
    }
  }

  function stop() {
    isStarted = false;
    controller?.abort();
  }
  return [start, stop] as const;
}

export function delay<T>(time: number, value?: T) {
  return async function* generator(): AsyncIterable<T> {
    yield* interval<T>(time, value);
  };
}

export function random(min: number, max: number) {
  return async function* generator(controller: AbortController) {
    let t = 0;
    while (controller.signal.aborted) {
      yield t;
      t = Math.floor(Math.random() * max) + min;
      await wait(t);
    }
  };
}

export function easeIn(n: number, by = 10, infinite = true) {
  const { abs, min, max, floor } = Math;
  const inc = floor(abs(n / by)),
    init = min(n, 0),
    till = max(n, 0);
  return async function* generator() {
    let t = init;
    while (true) {
      if (t >= till) {
        if (!infinite) {
          break;
        }
        t = init;
      }
      t = t + inc;
      const value = abs(t);
      yield value;
      await wait(value);
    }
  };
}

export function easeOut(max: number, by = 10, infinite = true) {
  return easeIn(0 - max, by, infinite);
}

export function easeInOut(n: number, by = 10) {
  const i = Math.floor(n / 2);
  const eIn = easeIn(i, by, false);
  const eOut = easeOut(n - i, by, false);
  return async function* generator() {
    while (true) {
      yield* eIn();
      yield* eOut();
    }
  };
}

export function debounce(ms: number) {
  let init = 0;
  let abort = new AbortController();
  return async function* (): AsyncIterable<number> {
    init++;
    abort.abort();
    try {
      abort = new AbortController();
      await wait(ms, undefined, { signal: abort.signal });
      yield init;
      init = 0;
    } catch (e) {}
  };
}

export function throttle(ms: number) {
  let init = 0;
  let prev = 0;
  return async function* (): AsyncIterable<number> {
    init++;
    let now = new Date().getTime();
    if (now - prev > ms) {
      prev = now;
      yield init;
      init = 0;
    }
  };
}
