import { subset } from "../utils/funs";
import { Getter } from "../utils/Getter";
import { Meta } from "../utils/Meta";
import { Factor } from "./Factor";
import { Reducer } from "./Reducer";

export interface Reduced<T = any> extends Array<T> {
  [Reduced.FACTOR]: Factor;
  [Reduced.REDUCER]: Reducer<any, T>;
  [Reduced.PARENT]?: Reduced<T>;
  [Reduced.INDICES]?: number[];
  [Reduced.VALUES]: T[];
  [Reduced.ORIGINAL_VALUES]: T[];
}

export namespace Reduced {
  export const PARENT = Symbol(`parent`);
  export const VALUES = Symbol(`values`);
  export const INDICES = Symbol(`indices`);
  export const FACTOR = Symbol(`factor`);
  export const REDUCER = Symbol(`reducer`);
  export const ORIGINAL_VALUES = Symbol(`original-values`);

  export function of<T>(
    reduced: T[] | Reduced<T>,
    factor: Factor,
    reducer: Reducer<any, T>,
    parent?: Reduced<T>,
  ): Reduced<T> {
    const result = reduced as Reduced<T>;
    result[VALUES] = reduced;
    result[FACTOR] = factor;
    result[REDUCER] = reducer;
    result[ORIGINAL_VALUES] = reduced;

    if (parent) setParent(result, parent);
    return result;
  }

  export function setParent<T>(child: Reduced<T>, parent: Reduced<T>) {
    child[PARENT] = parent;
  }

  export function parent<T>(reduced: Reduced<T>) {
    const [, factor, reducer, parent] = getMetadata(reduced);
    if (!parent) throw new Error(`Parent missing`);

    const parentIndices = Factor.parentIndices(getFactor(parent), factor);
    const array = subset(parent, parentIndices);

    const result = of(array, getFactor(parent), reducer, getParent(parent));
    setValues(result, parent);
    setIndices(result, parentIndices);
    result[ORIGINAL_VALUES] = reduced[ORIGINAL_VALUES];

    Meta.copy(reduced, result, [`name`, `queryable`, `reduced`]);

    return result;
  }

  export function stack<T>(reduced: Reduced<T>): Reduced<T> {
    const [values, factor, reducer, parent, indices] = getMetadata(reduced);

    if (!parent) throw new Error(`Cannot stack a without a parent`);

    const parentIndices = Factor.parentIndices(getFactor(parent), factor);

    const { reducefn, initialfn } = reducer;
    const [n, stack] = [values.length, [] as T[]];
    const stacked = Array.from(Array<T>(n), () => initialfn());
    const parentIndex = Getter.of(parentIndices);

    for (let i = 0; i < values.length; i++) {
      const index = parentIndex(i);
      if (stack[index] === undefined) stack[index] = initialfn();
      stack[index] = reducefn(stack[index], values[i]);
      stacked[i] = stack[index];
    }

    const array = indices ? subset(stacked, indices) : stacked;

    const result = Reduced.of(array, factor, reducer, parent);
    setValues(result, stacked);
    if (indices) setIndices(result, indices);
    result[ORIGINAL_VALUES] = reduced[ORIGINAL_VALUES];

    Meta.copy(reduced, result, [`name`, `queryable`, `reduced`]);

    return result;
  }

  export function normalize<T>(
    reduced: Reduced<T>,
    normalizefn: (x: T, y: T) => T,
  ): Reduced<T> {
    const [values, factor, reducer, parent, indices] = getMetadata(reduced);

    if (!parent) throw new Error(`Cannot normalize a without a parent`);

    const parentIndices = Factor.parentIndices(getFactor(parent), factor);
    const parentValues = subset(parent, parentIndices);

    const normalized = [...values];
    for (let i = 0; i < reduced.length; i++) {
      normalized[i] = normalizefn(normalized[i], parentValues[i]);
    }

    const array = indices ? subset(normalized, indices) : normalized;
    const result = Reduced.of(array, factor, reducer, parent);
    setValues(result, normalized);
    if (indices) setIndices(result, indices);
    result[ORIGINAL_VALUES] = reduced[ORIGINAL_VALUES];

    Meta.copy(reduced, result, [`name`, `queryable`, `reduced`]);

    return result;
  }

  export function shiftLeft<T>(reduced: Reduced<T>) {
    const [values, factor, reducer, parent, indices] = getMetadata(reduced);
    const shifted = [] as T[];

    shifted.push(reducer.initialfn());
    for (let i = 0; i < values.length - 1; i++) shifted.push(values[i]);

    const array = indices ? subset(shifted, indices) : shifted;
    const result = Reduced.of(array, factor, reducer, parent);
    setValues(result, shifted);
    if (indices) setIndices(result, indices);
    result[ORIGINAL_VALUES] = reduced[ORIGINAL_VALUES];

    Meta.copy(reduced, result, [`name`, `queryable`]);

    return result;
  }

  function getFactor(reduced: Reduced) {
    return reduced[FACTOR];
  }

  export function getParent(reduced: Reduced) {
    return reduced[PARENT];
  }

  function setValues<T>(reduced: Reduced<T>, values: T[]) {
    reduced[VALUES] = values;
  }

  function setIndices(reduced: Reduced, indices: number[]) {
    reduced[INDICES] = indices;
  }

  function getMetadata(reduced: Reduced) {
    return [
      reduced[VALUES],
      reduced[FACTOR],
      reduced[REDUCER],
      reduced[PARENT],
      reduced[INDICES],
    ] as const;
  }
}
