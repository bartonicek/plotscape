import { makeDispatchFn, makeListenFn } from "./funs";
import { EVENTTARGET } from "./symbols";

export interface Reactive {
  [EVENTTARGET]: EventTarget;
}

export namespace Reactive {
  export const listen = makeListenFn<Reactive, `changed`>();
  export const dispatch = makeDispatchFn<Reactive, `changed`>();

  export function set<T extends Reactive>(
    object: T,
    setfn: (object: T) => void
  ) {
    setfn(object);
    Reactive.dispatch(object, `changed`);
  }

  export function isReactive(
    object: Record<PropertyKey, any>
  ): object is Reactive {
    return object[EVENTTARGET] !== undefined;
  }

  export function of<T extends Dict<any>>(object: T) {
    return { ...object, [EVENTTARGET]: new EventTarget() };
  }
}
