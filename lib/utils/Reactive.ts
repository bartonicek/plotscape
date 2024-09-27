import { throttle } from "./funs";

const EVENTS = Symbol(`events`);
const LISTENERS = Symbol(`listeners`);
type EventCallback = (data?: Record<string, any>) => void;
type NonReactive<T extends Reactive> = Omit<
  T,
  typeof EVENTS | typeof LISTENERS
>;

/**
 * A reactive object (Observer pattern).
 */
export interface Reactive<T extends string = string & {}> {
  [EVENTS]: T;
  [LISTENERS]: Record<string, { priority: number; callback: EventCallback }[]>;
}

export type EventOf<T extends Reactive> = T[typeof EVENTS] | `changed`;

export namespace Reactive {
  /**
   * Makes an object `Reactive`. The function is curried so that
   * the generic `Event` type can be provided manually, if needed.
   * @returns A shallow copy of the object with listener symbol props.
   */
  export function of<E extends string = `changed`>() {
    return function <T extends Object>(object: T) {
      // Need to copy so that e.g. translated data gets assigned a new Reactive pointer
      return { ...object, [LISTENERS]: {} } as T & Reactive<E>;
    };
  }

  /**
   * Check whether an object is `Reactive`.
   * @param object An object
   * @returns `true` if the object is `Reactive`
   */
  export function isReactive(
    object: Record<PropertyKey, any>,
  ): object is Reactive {
    return object?.[LISTENERS] !== undefined;
  }

  /**
   * Listen for events of a specific type on an object using a callback.
   * `priority` can be used to make sure some callbacks get executed before
   * others, with lower-valued callbacks (e.g. `priority: 1`) getting executed
   * before higher-valued ones (e.g. `priority: 10`).
   *
   * @param object A `Reactive` object
   * @param type The event type (string)
   * @param callback A callback
   * @param options A list of options
   */
  export function listen<T extends Reactive>(
    object: T,
    type: EventOf<T>,
    callback: EventCallback,
    options?: { throttle?: number; priority?: number },
  ) {
    if (!Reactive.isReactive(object)) return;
    if (options?.throttle) callback = throttle(callback, options.throttle);

    const priority = options?.priority ?? 1;
    const listeners = object[LISTENERS];
    const listener = { priority, callback };

    if (!listeners[type]) listeners[type] = [];
    if (!listeners[type].includes(listener)) listeners[type].push(listener);

    listeners[type].sort((x, y) => x.priority - y.priority);
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
    if (!isReactive(object)) return;
    const listeners = object[LISTENERS][type];
    if (listeners) for (const { callback } of listeners) callback(data);
  }

  /**
   * Propagate event from one object to another.
   * The propagate function gets assigned `priority: 99`,
   * meaning that it should run after all other callbacks
   * registered on the objects.
   *
   * @param object1 A `Reactive` object
   * @param object2 Another `Reactive` object
   * @param event1 The type of event to propagate (string)
   */
  export function propagate<T extends Reactive, U extends Reactive>(
    object1: T,
    object2: U,
    event1: EventOf<T>,
    event2?: EventOf<U>,
    options?: { throttle?: number; priority?: number },
  ) {
    if (!isReactive(object1) || !isReactive(object2)) return;
    const propagatefn = () => dispatch(object2, event2 ?? event1);
    listen(object1, event1, propagatefn, options);
  }

  /**
   * Sets properties on an object and dispatches a generic `changed` event.
   * @param object A `Reactive` object
   * @param setfn A functions which sets some properties on the object
   */
  export function set<T extends Reactive>(
    object: T,
    setfn: (object: NonReactive<T>) => Partial<NonReactive<T>>,
  ) {
    if (!isReactive(object)) return;
    Object.assign(object, setfn(object));
    dispatch(object, `changed` as EventOf<T>);
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
    if (!isReactive(object)) return;

    const listeners = object[LISTENERS][type] ?? [];

    for (let i = 0; i < listeners.length; i++) {
      if (listeners[i].callback === listener) listeners.splice(i, 1);
    }
  }

  /**
   * Remove all listeners listening for a specific event from an object.
   * @param object A `Reactive` object
   * @param type The event type (string)
   */
  export function removeAll<T extends Reactive>(object: T, type: EventOf<T>) {
    if (!isReactive(object)) return;
    if (object[LISTENERS][type]) object[LISTENERS][type].length = 0;
  }

  /**
   * Remove all listeners from an object.
   * @param object A `Reactive` object
   */
  export function removeAllListeners<T extends Reactive>(object: T) {
    if (!isReactive(object)) return;
    const listeners = object[LISTENERS];
    if (listeners) for (const ls of Object.values(listeners)) ls.length = 0;
  }
}
