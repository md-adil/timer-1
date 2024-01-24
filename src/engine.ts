import {
  setTimeout as wait,
  setInterval as interval,
} from "node:timers/promises";
import { AbortError } from "./error";

export function timer<X, T extends unknown[]>(
  cb: (out: X, ...params: T) => void,
  speed: (controller: AbortController) => AsyncIterable<X>
) {
  let controller: AbortController;
  async function start(...params: T) {
    controller = new AbortController();
    try {
      for await (const _ of speed(controller)) {
        cb(_, ...params);
      }
    } catch (err) {
      if (!AbortError.is(err)) {
        throw err;
      }
    }
  }

  function stop() {
    controller?.abort();
  }
  return [start, stop] as const;
}

export function delay<T>(time: number, value?: T) {
  return async function* generator({
    signal,
  }: AbortController): AsyncIterable<T> {
    yield* interval<T>(time, value, { signal });
  };
}

export function random(min: number, max: number) {
  return async function* generator({ signal }: AbortController) {
    let t = 0;
    while (true) {
      yield t;
      t = Math.floor(Math.random() * max) + min;
      await wait(t, undefined, { signal });
    }
  };
}

export function easeIn(n: number, by = 10, infinite = true) {
  const { abs, min, max, floor } = Math;
  const inc = floor(abs(n / by)),
    init = min(n, 0),
    till = max(n, 0);
  return async function* generator({ signal }: AbortController) {
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
      await wait(value, undefined, { signal });
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
  return async function* generator(controller: AbortController) {
    while (true) {
      yield* eIn(controller);
      yield* eOut(controller);
    }
  };
}

export function debounce(ms: number) {
  let init = 0;
  let abort = new AbortController();
  return async function* ({ signal }: AbortController): AsyncIterable<number> {
    init++;
    abort.abort();
    signal.addEventListener("abort", () => abort.abort());
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
  return async function* generator(
    controller: AbortController
  ): AsyncIterable<number> {
    if (controller.signal.aborted) {
      throw new AbortError();
    }
    init++;
    let now = new Date().getTime();
    if (now - prev > ms) {
      prev = now;
      yield init;
      init = 0;
    }
  };
}
