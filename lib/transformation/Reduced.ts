import { subset } from "../utils/funs";
import { Getter } from "../utils/Getter";
import { FACTOR, Meta, REDUCER } from "../utils/Meta";
import { Reactive } from "../utils/Reactive";
import { Factor } from "./Factor";
import { Reducer } from "./Reducer";

const PARENT = Symbol(`parent`);
const VALUES = Symbol(`values`);
const INDICES = Symbol(`indices`);

export interface Reduced<T = any> extends Array<T>, Reactive {
  [FACTOR]: Factor;
  [REDUCER]: Reducer<any, T>;
  [VALUES]: T[];
  [PARENT]?: Reduced<T>;
  [INDICES]?: number[];
}

export namespace Reduced {
  export function of<T>(
    reduced: T[] | Reduced<T>,
    factor: Factor,
    reducer: Reducer<any, T>,
    parent?: Reduced<T>,
  ) {
    const result = reduced as Reduced<T>;
    result[VALUES] = reduced;
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
    const [, factor, reducer, parent] = getMetadata(reduced);
    if (!parent) throw new Error(`Parent missing`);

    const parentIndices = Factor.parentIndices(getFactor(parent), factor);
    const array = subset(parent, parentIndices);

    const result = of(array, getFactor(parent), reducer, getParent(parent));
    setValues(result, parent);
    setIndices(result, parentIndices);
    Meta.copyName(reduced, result);

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
    Meta.copyName(reduced, result);

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
    Meta.copyName(reduced, result);

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
    Meta.copyName(reduced, result);

    return result;
  }

  function getFactor(reduced: Reduced) {
    return reduced[FACTOR];
  }

  function getReducer(reduced: Reduced) {
    return reduced[REDUCER];
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
