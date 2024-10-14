import { AnyFn } from "./types";

export const METHODS = Symbol(`methods`);

export interface Polymorphic {
  [METHODS]: Record<string, AnyFn>;
}

/**
 * A set of functionalities for creating and dispatching polymorphic functions.
 */
export namespace Polymorphic {
  /**
   * Creates a polymorphic function.
   * @param defaultfn A fallback function (that also defines the signature)
   * @param dispatchfn An optional dispatch function that takes the parameters of
   * `defaultfn` and produces a string
   * @returns A polymorphic version of the function
   */
  export function of<T extends AnyFn>(
    defaultfn: T,
    dispatchfn?: (args: Parameters<T>) => string,
  ) {
    const result = function (...args: Parameters<T>) {
      const target = dispatchfn ? dispatchfn(args) : args[0].type;
      return dispatch(result, defaultfn, target)(...args);
    } as typeof defaultfn & Polymorphic;

    result[METHODS] = {};
    return result;
  }

  /**
   * Dispatches on a polymorphic function.
   * @param polyfn A polymorphic function
   * @param defaultfn A default function
   * @param type A type (string)
   * @returns A concrete implementation of the polymorphic function
   */
  export function dispatch<T extends AnyFn & Polymorphic>(
    polyfn: T,
    defaultfn: AnyFn,
    type: string,
  ) {
    return polyfn[METHODS][type] ?? defaultfn;
  }

  /**
   * Set an implementation of a polymorphic function
   * @param polyfn A polymorphic function
   * @param type The type to dispatch on (string)
   * @param fn The implementation/method
   */
  export function set<T extends AnyFn>(
    polyfn: T & Polymorphic,
    type: string,
    fn: T,
  ) {
    polyfn[METHODS][type] = fn;
  }
}
