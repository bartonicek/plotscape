import { makeGetter } from "../utils/funs";
import { Indexable } from "../utils/types";
import { Factor } from "./Factor";
import { Reduced } from "./Reduced";

export type Reducer<T = any, U = any, V = U> = {
  name: string;
  initialfn: () => U;
  reducefn: (prev: U, next: T) => U;
  afternfn?: (result: U) => V;
};

export namespace Reducer {
  export const sum: Reducer<number, number> = {
    name: `sum`,
    initialfn: () => 0,
    reducefn: (prev: number, next: number) => prev + next,
  };

  export const max: Reducer<number, number> = {
    name: `max`,
    initialfn: () => -Infinity,
    reducefn: (prev: number, next: number) => Math.max(prev, next),
  };

  export const product: Reducer<number, number> = {
    name: `product`,
    initialfn: () => 1,
    reducefn: (prev: number, next: number) => prev * next,
  };

  export const table: Reducer<string, Record<string, number>> = {
    name: `typical`,
    initialfn: () => ({}),
    reducefn: (prev: Record<string, number>, next: string) => {
      prev[next] = prev[next] + 1 || 0;
      return prev;
    },
    // afterfn: (result: Record<string, number>) => {
    //   let [value, count] = [``, 0];
    //   for (const [k, v] of Object.entries(result)) {
    //     if (v >= count) (value = k), (count = v);
    //   }
    //   return value;
    // },
  };

  export function reduce<T, U>(
    values: Indexable<T>,
    factor: Factor,
    reducer: Reducer<T, U>
  ) {
    const { indices, cardinality: n } = factor;
    const { initialfn, reducefn } = reducer;

    const result = Array.from(Array(n), () => initialfn());

    const index = makeGetter(indices);
    const value = makeGetter(values);

    for (let i = 0; i < indices.length; i++) {
      result[index(i)] = reducefn(result[index(i)], value(i));
    }

    return Reduced.of(result, factor, reducer);
  }
}
