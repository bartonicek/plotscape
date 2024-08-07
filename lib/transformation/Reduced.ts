import { Getter } from "../utils/Getter";
import { Reactive } from "../utils/Reactive";
import { FACTOR, PARENTVALUES, REDUCER } from "../utils/symbols";
import { Factor } from "./Factor";
import { Reducer } from "./Reducer";

export interface Reduced<T = any> extends Array<T>, Reactive {
  parent?: Array<T>;
  [FACTOR]: Factor;
  [REDUCER]: Reducer<any, T>;
  [PARENTVALUES]: Array<T>;
}

export namespace Reduced {
  export function of<T>(
    reduced: T[] | Reduced<T>,
    factor: Factor,
    reducer: Reducer<any, T>,
    parentValues?: T[],
  ) {
    const result = reduced as Reduced<T>;
    result[FACTOR] = factor;
    result[REDUCER] = reducer;
    if (parentValues) result[PARENTVALUES] = parentValues;

    return result;
  }

  export const listen = Reactive.makeListenFn<Reduced, `changed`>();
  export const dispatch = Reactive.makeDispatchFn<Reduced, `changed`>();

  export function parent<T>(reduced: Reduced<T>) {
    const [factor, reducer, parentValues] = getPointers(reduced);
    return of(parentValues, factor, reducer);
  }

  export function stack<T>(reduced: Reduced<T>): Reduced<T> {
    const [factor, reducer, parentValues] = getPointers(reduced);
    const { parentIndices } = factor;

    if (!parentIndices) {
      throw new Error(`Cannot stack because factor does not have a parent`);
    }

    const { reducefn, initialfn } = reducer;
    const [n, stacked] = [reduced.length, [] as T[]];
    const array = Array.from(Array<T>(n), () => initialfn()) as Reduced<T>;
    const parentIndex = Getter.of(parentIndices);

    for (let i = 0; i < reduced.length; i++) {
      const index = parentIndex(i);
      if (stacked[index] === undefined) stacked[index] = initialfn();
      stacked[index] = reducefn(stacked[index], reduced[i]);
      array[i] = stacked[index];
    }

    return Reduced.of(array, factor, reducer, parentValues);
  }

  export function normalize<T>(
    reduced: Reduced<T>,
    normalizefn: (x: T, y: T) => T,
  ): Reduced<T> {
    const [factor, reducer, parentValues] = getPointers(reduced);

    if (!parentValues) {
      throw new Error(`Cannot normalize because of missing parent values`);
    }

    const array = [...reduced] as Reduced<T>;
    for (let i = 0; i < reduced.length; i++) {
      array[i] = normalizefn(array[i], parentValues[i]);
    }

    return Reduced.of(array, factor, reducer, parentValues);
  }

  export function shiftLeft<T>(reduced: Reduced<T>) {
    const [factor, reducer, parentValues] = getPointers(reduced);
    const array = [] as T[];

    array.push(reducer.initialfn());
    for (let i = 0; i < reduced.length - 1; i++) array.push(reduced[i]);

    return Reduced.of(array, factor, reducer, parentValues);
  }

  function getPointers(reduced: Reduced) {
    return [reduced[FACTOR], reduced[REDUCER], reduced[PARENTVALUES]] as const;
  }
}
