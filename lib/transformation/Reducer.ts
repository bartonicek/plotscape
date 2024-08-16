import { makeGetter } from "../utils/funs";
import { Meta } from "../utils/Meta";
import { Indexable } from "../utils/types";
import { Factor } from "./Factor";
import { Reduced } from "./Reduced";

export type Reducer<T = any, U = any, V = U> = {
  name: string;
  fallback?: string;
  initialfn: () => U;
  reducefn: (prev: U, next: T) => U;
  afternfn?: (result: U) => V;
};

export namespace Reducer {
  export type Name = `sum` | `max` | `product` | `table`;

  export const sum: Reducer<number, number> = {
    name: `sum`,
    fallback: `count`,
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
    name: `table`,
    initialfn: () => ({}),
    reducefn: (prev: Record<string, number>, next: string) => {
      prev[next] = prev[next] + 1 || 0;
      return prev;
    },
  };

  export function get(value: Name | Reducer) {
    if (typeof value === `string`) return Reducer[value];
    return value;
  }

  export function reduce<T, U>(
    values: Indexable<T>,
    factor: Factor,
    reducer: Reducer<T, U>,
  ) {
    const { indices, cardinality: n } = factor;
    const { initialfn, reducefn } = reducer;

    const array = Array.from(Array(n), () => initialfn());

    const index = makeGetter(indices);
    const value = makeGetter(values);

    for (let i = 0; i < indices.length; i++) {
      array[index(i)] = reducefn(array[index(i)], value(i));
    }

    const result = Reduced.of(array, factor, reducer);
    Meta.copy(values as any, result);
    Meta.setName(result, getName(array, reducer) ?? `[unknown summary]`);

    return result;
  }

  export function getName(reducable: Indexable, reducer: Reducer) {
    if (!Meta.hasName(reducable)) return reducer.fallback;
    return `${reducer.name} of ${Meta.getName(reducable)}`;
  }
}
