import { Reactive } from "../Reactive";
import { makeDispatchFn, makeListenFn } from "../utils/funs";
import { FACTOR, PARENTVALUES, REDUCER } from "../utils/symbols";
import { Factor } from "./Factor";
import { Reducer } from "./Reducer";

export interface Reduced<T = any> extends Array<T>, Reactive {
  [FACTOR]: Factor;
  [REDUCER]: Reducer<any, T>;
  [PARENTVALUES]: Array<T>;
}

export namespace Reduced {
  export function of<T>(
    reduced: T[] | Reduced<T>,
    factor: Factor,
    reducer: Reducer<any, T>,
    parentValues?: T[]
  ) {
    const result = reduced as Reduced<T>;
    result[FACTOR] = factor;
    result[REDUCER] = reducer;
    if (parentValues) result[PARENTVALUES] = parentValues;
    return result;
  }

  export const listen = makeListenFn<Reduced, `changed`>();
  export const dispatch = makeDispatchFn<Reduced, `changed`>();

  export function stack<T>(reduced: Reduced<T>): Reduced<T> {
    const [factor, reducer, parentValues] = getPointers(reduced);

    const { parentIndices } = factor;

    if (!parentIndices) {
      throw new Error(`Cannot stack because factor does not have a parent`);
    }

    const { reducefn, initialfn } = reducer;
    const stacked = [] as T[];
    const n = reduced.length;
    const computed = Array.from(Array<T>(n), () => initialfn()) as Reduced<T>;

    for (let i = 0; i < reduced.length; i++) {
      const index = parentIndices[i];
      if (stacked[index] === undefined) stacked[index] = initialfn();
      stacked[index] = reducefn(stacked[index], reduced[i]);
      computed[i] = stacked[index];
    }

    return Reduced.of(computed, factor, reducer, parentValues);
  }

  export function normalize<T>(
    reduced: Reduced<T>,
    normalizefn: (x: T, y: T) => T
  ): Reduced<T> {
    const [factor, reducer, parentValues] = getPointers(reduced);

    if (!parentValues) {
      throw new Error(`Cannot normalize because of missing parent values`);
    }

    const computed = [...reduced] as Reduced<T>;
    for (let i = 0; i < reduced.length; i++) {
      computed[i] = normalizefn(computed[i], parentValues[i]);
    }

    return Reduced.of(computed, factor, reducer, parentValues);
  }

  function getPointers(reduced: Reduced) {
    return [reduced[FACTOR], reduced[REDUCER], reduced[PARENTVALUES]] as const;
  }
}
