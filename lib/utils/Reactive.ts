import * as funs from "./funs";

const EVENTS = Symbol(`events`);
const LISTENERS = Symbol(`listeners`);
const DEFERRED = Symbol(`deferred`);

type EventCallback = (data?: Record<string, any>) => void;

/**
 * A reactive object (Observer pattern).
 */
export interface Reactive<T extends string = string> {
  [EVENTS]: T;
  [LISTENERS]: Record<string, EventCallback[]>;
  [DEFERRED]: Record<string, EventCallback[]>;
}

type EventOf<T extends Reactive> = T[typeof EVENTS];

export namespace Reactive {
  /**
   * Makes an object `Reactive`. The function is curried so that
   * the generic `Event` type can be provided manually, if needed.
   * @returns A shallow copy of the object with listener symbol props.
   */
  export function of<E extends string = `changed`>() {
    return function <T extends Object>(object: T) {
      // Need to copy so that e.g. translated data gets assigned a new Reactive pointer
      return { ...object, [LISTENERS]: {}, [DEFERRED]: {} } as T & Reactive<E>;
    };
  }

  /**
   * Check whether an object is `Reactive`.
   * @param object An object
   * @returns `true` if the object is `Reactive`
   */
  export function is(object: Record<PropertyKey, any>): object is Reactive {
    return object[LISTENERS] !== undefined;
  }

  /**
   * Listen for events of a specific type on an object using a callback.
   * Can be 'deferred', meaning that the callback gets added to a second
   * array of listeners that only runs after the first has finished running
   * (useful if e.g. we want to propagate updates to another object but want to
   * make sure all of the updates on the first object run first). The callback can
   * also be throttled.
   *
   * @param object A `Reactive` object
   * @param type The event type (string)
   * @param listenfn A callback
   * @param options A list of options
   */
  export function listen<T extends Reactive>(
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

  /**
   * Dispatch an event.
   * @param object A `Reactive` object
   * @param type The event type (string)
   * @param data An optional dictionary with additional data
   */
  export function dispatch<T extends Reactive>(
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

  /**
   * Propagate event from one object to another.
   * @param object1 A `Reactive` object
   * @param object2 Another `Reactive` object
   * @param type The type of event to propagate (string)
   */
  export function propagate<T extends Reactive, U extends Reactive>(
    object1: T,
    object2: U,
    type: EventOf<T>,
  ) {
    const propagatefn = () => Reactive.dispatch(object2, type);
    Reactive.listen(object1, type, propagatefn, { defer: true });
  }

  /**
   * Sets properties on an object and dispatches a generic `changed` event.
   * @param object A `Reactive` object
   * @param setfn A functions which sets some properties on the object
   */
  export function set<T extends Reactive>(
    object: T,
    setfn: (object: T) => void,
  ) {
    setfn(object);
    Reactive.dispatch(object, `changed` as EventOf<T>);
  }

  /**
   * Remove a listener listening for a specific event from an object.
   * @param object A `Reactive` object
   * @param type The event type (string)
   * @param listener A callback
   */
  export function remove<T extends Reactive>(
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

  /**
   * Remove all listeners listening for a specific event from an object.
   * @param object A `Reactive` object
   * @param type The event type (string)
   */
  export function removeAll<T extends Reactive>(object: T, type: EventOf<T>) {
    const [listeners, deferred] = [
      object[LISTENERS][type],
      object[DEFERRED][type],
    ];

    if (listeners) for (const cb of listeners) funs.remove(listeners, cb);
    if (deferred) for (const cb of deferred) funs.remove(deferred, cb);
  }

  /**
   * Remove all listeners from an object.
   * @param object A `Reactive` object
   */
  export function removeAllListeners<T extends Reactive>(object: T) {
    const [listeners, deferred] = [object[LISTENERS], object[DEFERRED]];

    if (listeners) for (const cbs of Object.values(listeners)) cbs.length = 0;
    if (deferred) for (const cbs of Object.values(deferred)) cbs.length = 0;
  }
}
