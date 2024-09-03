import * as funs from "./funs";

const EVENTS = Symbol(`events`);
const LISTENERS = Symbol(`listeners`);
const DEFERRED = Symbol(`deferred`);

type EventCallback = (data?: Record<string, any>) => void;

export interface Reactive<T extends string = `changed`> {
  [EVENTS]: T;
  [LISTENERS]: Record<string, EventCallback[]>;
  [DEFERRED]: Record<string, EventCallback[]>;
}

type EventOf<T extends Reactive> = T[typeof EVENTS];

export namespace Reactive {
  export function of2<E extends string = `changed`>() {
    return function <T extends Object>(object: T) {
      // Need to copy so that e.g. translated data gets assigned a new pointer
      return { ...object, [LISTENERS]: {}, [DEFERRED]: {} } as T & Reactive<E>;
    };
  }

  export function listen<T extends Reactive<any>>(
    object: T,
    type: EventOf<T>,
    listenfn: EventCallback,
    options?: { throttle?: number; defer?: boolean },
  ) {
    if (options?.throttle) listenfn = funs.throttle(listenfn, options.throttle);
    const listeners = options?.defer ? object[DEFERRED] : object[LISTENERS];
    if (!listeners[type]) listeners[type] = [];
    if (!listeners[type].includes(listenfn)) listeners[type].push(listenfn);
  }

  export function dispatch<T extends Reactive<any>>(
    object: T,
    type: EventOf<T>,
    data?: Record<string, any>,
  ) {
    const [listeners, deferred] = [
      object[LISTENERS][type],
      object[DEFERRED][type],
    ];

    if (listeners) for (const cb of listeners) cb(data);
    // Run deferred callbacks only after regular callbacks
    if (deferred) for (const cb of deferred) cb(data);
  }

  export function propagate<
    E extends string,
    T extends Reactive<E>,
    U extends Reactive<E>,
  >(object1: T, object2: U, type: E) {
    const propagatefn = () => Reactive.dispatch(object2, type);
    Reactive.listen(object1, type, propagatefn, { defer: true });
  }

  export function propagateChange(
    object1: Reactive,
    object2: Reactive,
    options?: { throttle?: number; deferred?: boolean },
  ) {
    const propagatefn = () => Reactive.dispatch(object2, `changed`);
    Reactive.listen(object1, `changed`, propagatefn, options);
  }

  export function is(object: Record<PropertyKey, any>): object is Reactive {
    return object[LISTENERS] !== undefined;
  }

  export function set<T extends Reactive>(
    object: T,
    setfn: (object: T) => void,
  ) {
    setfn(object);
    Reactive.dispatch(object, `changed`);
  }

  export function remove<T extends Reactive<any>>(
    object: T,
    type: EventOf<T>,
    listener: EventCallback,
  ) {
    const [listeners, deferred] = [
      object[LISTENERS][type],
      object[DEFERRED][type],
    ];

    if (listeners) funs.remove(listeners, listener);
    if (deferred) funs.remove(deferred, listener);
  }

  export function removeAll<T extends Reactive<any>>(
    object: T,
    type: EventOf<T>,
  ) {
    const [listeners, deferred] = [
      object[LISTENERS][type],
      object[DEFERRED][type],
    ];

    if (listeners) for (const cb of listeners) funs.remove(listeners, cb);
    if (deferred) for (const cb of deferred) funs.remove(deferred, cb);
  }

  export function removeAllListeners<T extends Reactive<any>>(object: T) {
    const [listeners, deferred] = [object[LISTENERS], object[DEFERRED]];

    if (listeners) for (const cbs of Object.values(listeners)) cbs.length = 0;
    if (deferred) for (const cbs of Object.values(deferred)) cbs.length = 0;
  }
}
