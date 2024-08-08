import { subset } from "../utils/funs";
import { Getter } from "../utils/Getter";
import { FACTOR, REDUCER } from "../utils/Meta";
import { Reactive } from "../utils/Reactive";
import { Factor } from "./Factor";
import { Reducer } from "./Reducer";

const PARENT = Symbol(`parent`);

export interface Reduced<T = any> extends Array<T>, Reactive {
  [PARENT]?: Reduced<T>;
  [FACTOR]: Factor;
  [REDUCER]: Reducer<any, T>;
}

export namespace Reduced {
  export function of<T>(
    reduced: T[] | Reduced<T>,
    factor: Factor,
    reducer: Reducer<any, T>,
    parent?: Reduced<T>,
  ) {
    const result = reduced as Reduced<T>;
    result[FACTOR] = factor;
    result[REDUCER] = reducer;
    if (parent) setParent(result, parent);

    return result;
  }

  export const listen = Reactive.makeListenFn<Reduced, `changed`>();
  export const dispatch = Reactive.makeDispatchFn<Reduced, `changed`>();

  export function setParent<T>(child: Reduced<T>, parent: Reduced<T>) {
    child[PARENT] = parent;
  }

  export function parent<T>(reduced: Reduced<T>) {
    const [factor, reducer, parent] = getMetadata(reduced);
    if (!parent) throw new Error(`Parent missing`);

    const parentIndices = Factor.parentIndices(getFactor(parent), factor);
    const parentValues = subset(parent, parentIndices);

    return of(parentValues, factor, reducer, getParent(parent));
  }

  export function stack<T>(reduced: Reduced<T>): Reduced<T> {
    const [factor, reducer, parent] = getMetadata(reduced);

    if (!parent) throw new Error(`Cannot stack a without a parent`);

    const parentIndices = Factor.parentIndices(getFactor(parent), factor);

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

    return Reduced.of(array, factor, reducer, parent);
  }

  export function normalize<T>(
    reduced: Reduced<T>,
    normalizefn: (x: T, y: T) => T,
  ): Reduced<T> {
    const [factor, reducer, parent] = getMetadata(reduced);

    if (!parent) throw new Error(`Cannot normalize a without a parent`);

    const parentIndices = Factor.parentIndices(getFactor(parent), factor);
    const parentValues = subset(parent, parentIndices);

    const array = [...reduced] as Reduced<T>;
    for (let i = 0; i < reduced.length; i++) {
      array[i] = normalizefn(array[i], parentValues[i]);
    }

    return Reduced.of(array, factor, reducer, parent);
  }

  export function shiftLeft<T>(reduced: Reduced<T>) {
    const [factor, reducer, parent] = getMetadata(reduced);
    const array = [] as T[];

    array.push(reducer.initialfn());
    for (let i = 0; i < reduced.length - 1; i++) array.push(reduced[i]);

    return Reduced.of(array, factor, reducer, parent);
  }

  function getFactor(reduced: Reduced) {
    return reduced[FACTOR];
  }

  function getReducer(reduced: Reduced) {
    return reduced[REDUCER];
  }

  function getParent(reduced: Reduced) {
    return reduced[PARENT];
  }

  function getMetadata(reduced: Reduced) {
    return [reduced[FACTOR], reduced[REDUCER], reduced[PARENT]] as const;
  }
}
