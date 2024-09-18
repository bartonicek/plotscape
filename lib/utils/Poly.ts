import { AnyFn } from "./types";

export const METHODS = Symbol(`methods`);

export interface Poly {
  [METHODS]: Record<string, AnyFn>;
}

export namespace Poly {
  export function of<T extends AnyFn>(defaultfn: T) {
    const result = function (...args: any[]) {
      return dispatch(result, defaultfn, args[0].type)(...args);
    } as typeof defaultfn & Poly;

    result[METHODS] = {};
    return result;
  }

  export function dispatch(polyfn: Poly, defaultfn: AnyFn, type: string) {
    return polyfn[METHODS][type] ?? defaultfn;
  }

  export function set<T extends AnyFn>(polyfn: T & Poly, name: string, fn: T) {
    polyfn[METHODS][name] = fn;
  }
}
