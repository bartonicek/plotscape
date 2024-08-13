import { remove, throttle } from "./funs";

const LISTENERS = Symbol(`listeners`);
const DEFERRED = Symbol(`deferred`);

export interface Reactive<T extends string = string> {
  [LISTENERS]: Record<string, EventCb[]>;
  [DEFERRED]: Record<string, EventCb[]>;
}

type EventCb = (data: any) => void;

export namespace Reactive {
  export function of<T extends Dict<any>>(object: T) {
    const listeners = {} as Record<string, EventCb[]>;
    const deferred = {} as Record<string, EventCb[]>;

    return { ...object, [LISTENERS]: listeners, [DEFERRED]: deferred };
  }

  export const listen = makeListenFn<Reactive, `changed`>();
  export const dispatch = makeDispatchFn<Reactive, `changed`>();

  export function getListeners(object: Reactive) {
    return object[LISTENERS];
  }

  export function getDeferred(object: Reactive) {
    return object[DEFERRED];
  }

  export function propagateChange(
    object1: Reactive,
    object2: Reactive,
    options?: { throttle?: number; deferred?: boolean },
  ) {
    const propagatefn = () => Reactive.dispatch(object2, `changed`);
    Reactive.listen(object1, `changed`, propagatefn, options);
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

  export function removeListeners(object: Object, type: string) {
    if (!isReactive(object)) return;

    const [listeners, deferred] = [
      getListeners(object)[type],
      getDeferred(object)[type],
    ];

    if (listeners) for (const cb of listeners) remove(listeners, cb);
    if (deferred) for (const cb of deferred) remove(deferred, cb);
  }

  export function makeListenFn<T extends Reactive, E extends string>() {
    return function (
      object: T,
      type: E,
      eventfn: (data: any) => void,
      options?: { throttle?: number; deferred?: boolean },
    ) {
      if (!isReactive(object)) return;
      if (options?.throttle) eventfn = throttle(eventfn, options.throttle);

      const isDeferred = !!options?.deferred;
      const listeners = isDeferred ? getDeferred(object) : getListeners(object);

      if (!listeners[type]) listeners[type] = [];
      if (!listeners[type].includes(eventfn)) listeners[type].push(eventfn);
    };
  }

  export function makeDispatchFn<T extends Reactive, E extends string>() {
    return function (object: T, type: E, data?: Record<string, any>) {
      if (!isReactive(object)) return;

      const [listeners, deferred] = [
        getListeners(object)[type],
        getDeferred(object)[type],
      ];

      if (listeners) for (const cb of listeners) cb(data);
      // Run deferred callbacks only after regular callbacks
      if (deferred) for (const cb of deferred) cb(data);
    };
  }
}
