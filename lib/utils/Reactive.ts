import { throttle } from "./funs";

const LISTENERS = Symbol(`listeners`);
const DEFERRED = Symbol(`deferred`);

export interface Reactive<T extends string = string> {
  [LISTENERS]: Record<string, Set<(data: any) => void>>;
  [DEFERRED]: Record<string, Set<(data: any) => void>>;
}

export namespace Reactive {
  export function of<T extends Dict<any>>(object: T) {
    const listeners = {} as Record<string, Set<(data: any) => void>>;
    const deferred = {} as Record<string, Set<(data: any) => void>>;

    return { ...object, [LISTENERS]: listeners, [DEFERRED]: deferred };
  }

  export const listen = makeListenFn<Reactive, `changed`>();
  export const dispatch = makeDispatchFn<Reactive, `changed`>();

  export function propagate(
    object1: Reactive,
    object2: Reactive,
    options?: { throttle?: number; deferred?: boolean },
  ) {
    Reactive.listen(
      object1,
      `changed`,
      () => Reactive.dispatch(object2, `changed`),
      options,
    );
  }

  export function isReactive(
    object: Record<PropertyKey, any>,
  ): object is Reactive {
    return object[LISTENERS] !== undefined;
  }

  export function set<T extends Reactive>(
    object: T,
    setfn: (object: T) => void,
  ) {
    setfn(object);
    Reactive.dispatch(object, `changed`);
  }

  export function removeListeners(object: Reactive, type: string) {
    if (!object[LISTENERS][type]) return;
    for (const cb of object[LISTENERS][type]) {
      object[LISTENERS][type].delete(cb);
    }
  }

  export function makeListenFn<T extends Reactive, E extends string>() {
    return function (
      object: T,
      type: E,
      eventfn: (data: any) => void,
      options?: { throttle?: number; deferred?: boolean },
    ) {
      if (options?.throttle) eventfn = throttle(eventfn, options.throttle);

      const listeners = options?.deferred
        ? object[DEFERRED]
        : object[LISTENERS];

      if (!listeners[type]) listeners[type] = new Set();
      listeners[type].add(eventfn);
    };
  }

  export function makeDispatchFn<T extends Reactive, E extends string>() {
    return function (object: T, type: E, data?: Record<string, any>) {
      if (!object[LISTENERS][type]) return;
      for (const cb of object[LISTENERS][type]) cb(data);

      // Run deferred callbacks only after regular callbacks
      if (!object[DEFERRED][type]) return;
      for (const cb of object[DEFERRED][type]) cb(data);
    };
  }
}
