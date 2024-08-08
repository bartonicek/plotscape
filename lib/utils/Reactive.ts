import { throttle } from "./funs";

export const EVENTTARGET = Symbol(`eventTarget`);
const LISTENERS = Symbol(`listeners`);

declare global {
  interface EventTarget {
    [LISTENERS]: Record<string, Set<EventListener>>;
  }
}

export interface Reactive {
  [EVENTTARGET]: EventTarget;
}

export namespace Reactive {
  export const listen = makeListenFn<Reactive, `changed`>();
  export const dispatch = makeDispatchFn<Reactive, `changed`>();

  export function of<T extends Dict<any>>(object: T) {
    const eventTarget = new EventTarget();
    eventTarget[LISTENERS] = {};
    return { ...object, [EVENTTARGET]: eventTarget };
  }

  export function isReactive(
    object: Record<PropertyKey, any>,
  ): object is Reactive {
    return object[EVENTTARGET] !== undefined;
  }

  export function set<T extends Reactive>(
    object: T,
    setfn: (object: T) => void,
  ) {
    setfn(object);
    Reactive.dispatch(object, `changed`);
  }

  function getAllListeners(object: Reactive) {
    return object[EVENTTARGET][LISTENERS];
  }

  export function removeListeners(object: Reactive, type: string) {
    const listeners = getAllListeners(object)[type];
    if (!listeners) return;

    for (const listener of listeners) {
      object[EVENTTARGET].removeEventListener(type, listener);
    }
  }

  export function makeListenFn<T extends Reactive, E extends string>() {
    return function (
      object: T,
      type: E,
      eventfn: (event: CustomEvent) => void,
      options?: { throttle?: number },
    ) {
      if (options?.throttle) eventfn = throttle(eventfn, options.throttle);
      const listeners = getAllListeners(object);
      if (!listeners[type]) listeners[type] = new Set();
      listeners[type].add(eventfn as EventListener);
      object[EVENTTARGET].addEventListener(type, eventfn as EventListener);
    };
  }

  export function makeDispatchFn<T extends Reactive, E extends string>() {
    return function (object: T, type: E, data?: Record<string, any>) {
      object[EVENTTARGET].dispatchEvent(
        new CustomEvent(type, { detail: data }),
      );
    };
  }
}
