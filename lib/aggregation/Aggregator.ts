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

  export function stack<T>(
    aggregate: T[],
    reducer: Reducer<T, T>,
    factor: Factor
  ) {
    const { parent } = factor;

    if (!parent) throw new Error(`Factor does not have a parent`);
    const { reducefn, initialfn } = reducer;

    const stacked = Array.from(Array<T>(parent.cardinality), () => initialfn());
    const result = Array.from(Array<T>(aggregate.length), () => initialfn());

    for (let i = 0; i < aggregate.length; i++) {
      const index = factor.data[PARENT][i];
      stacked[index] = reducefn(stacked[index], aggregate[i]);
      result[i] = stacked[index];
    }

    return result;
  }

  export function normalize<T>(
    aggregate: T[],
    parentAggregate: T[],
    factor: Factor,
    normalizefn: (x: T, y: T) => T
  ) {
    const { parent } = factor;

    if (!parent) throw new Error(`Factor does not have a parent`);
    const result = [...aggregate];

    for (let i = 0; i < aggregate.length; i++) {
      const index = factor.data[PARENT][i];
      result[i] = normalizefn(result[i], parentAggregate[index]);
    }

    return result;
  }
}
