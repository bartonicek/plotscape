import { AnyFn } from "./types";

export const METHODS = Symbol(`methods`);

export interface Polymorphic {
  [METHODS]: Record<string, AnyFn>;
}

export namespace Polymorphic {
  export function of<T extends AnyFn>(defaultfn: T) {
    const result = function (...args: any[]) {
      return dispatch(result, defaultfn, args[0].type)(...args);
    } as typeof defaultfn & Polymorphic;

    result[METHODS] = {};
    return result;
  }

  export function dispatch(
    polyfn: Polymorphic,
    defaultfn: AnyFn,
    type: string,
  ) {
    return polyfn[METHODS][type] ?? defaultfn;
  }

  export function set<T extends AnyFn>(
    polyfn: T & Polymorphic,
    name: string,
    fn: T,
  ) {
    polyfn[METHODS][name] = fn;
  }
}
