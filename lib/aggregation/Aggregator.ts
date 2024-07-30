import { makeGetter } from "../utils/funs";
import { PARENT } from "../utils/symbols";
import { Indexable, Reducer } from "../utils/types";
import { Factor } from "./Factor";

export namespace Aggregator {
  export const sum = {
    name: `sum`,
    initialfn: () => 0,
    reducefn: (x: number, y: number) => x + y,
  };

  export function aggregate<T, U>(
    values: Indexable<T>,
    factor: Factor,
    reducer: Reducer<T, U>
  ) {
    const { indices, cardinality } = factor;
    const { initialfn, reducefn } = reducer;

    const result = Array.from(Array(cardinality), () => initialfn());
    const index = makeGetter(indices);
    const value = makeGetter(values);

    for (let i = 0; i < indices.length; i++) {
      result[index(i)] = reducefn(result[index(i)], value(i));
    }

    return result;
  }

  export function stack<T>(array: T[], factor: Factor, reducer: Reducer<T, T>) {
    const { parentIndices } = factor;
    if (!parentIndices) throw new Error(`Factor does not have a parent`);

    const { reducefn, initialfn } = reducer;

    const stacked = [] as T[];
    const result = Array.from(Array<T>(array.length), () => initialfn());

    for (let i = 0; i < array.length; i++) {
      const index = parentIndices[i];
      if (stacked[index] === undefined) stacked[index] = initialfn();
      stacked[index] = reducefn(stacked[index], array[i]);
      result[i] = stacked[index];
    }

    result[PARENT] = stacked;
    return result;
  }

  export function normalize<T>(
    array: T[],
    factor: Factor,
    normalizefn: (x: T, y: T) => T
  ) {
    const { parentIndices } = factor;
    const parentAggregate = array[PARENT];

    if (!parentIndices) throw new Error(`Factor does not have a parent`);
    if (!parentAggregate) throw new Error(`Values have not been stacked`);

    const result = [...array];

    for (let i = 0; i < array.length; i++) {
      const index = parentIndices[i];
      result[i] = normalizefn(result[i], parentAggregate[index]);
    }

    return result;
  }
}
