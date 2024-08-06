import { throttle } from "./funs";

export const EVENTTARGET = Symbol(`eventTarget`);

export interface Reactive {
  [EVENTTARGET]: EventTarget;
}

export namespace Reactive {
  export const listen = makeListenFn<Reactive, `changed`>();
  export const dispatch = makeDispatchFn<Reactive, `changed`>();

  export function set<T extends Reactive>(
    object: T,
    setfn: (object: T) => void,
  ) {
    setfn(object);
    Reactive.dispatch(object, `changed`);
  }

  export function isReactive(
    object: Record<PropertyKey, any>,
  ): object is Reactive {
    return object[EVENTTARGET] !== undefined;
  }

  export function of<T extends Dict<any>>(object: T) {
    return { ...object, [EVENTTARGET]: new EventTarget() };
  }

  export function makeListenFn<T extends Reactive, E extends string>() {
    return function (
      object: T,
      type: E,
      eventfn: (event: CustomEvent) => void,
      options?: { throttle?: number },
    ) {
      if (options?.throttle) eventfn = throttle(eventfn, options.throttle);
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
