import { isObject } from "../main";
import { Getter } from "../utils/Getter";
import { Indexable } from "../utils/Indexable";
import { Meta } from "../utils/Meta";
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
  export type Stringified = {
    name: string;
    initialfn: string;
    reducefn: string;
  };

  export type Like = Name | Reducer | Stringified;

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

  export function parse(value: Name | Reducer | Stringified) {
    if (typeof value === `string`) return Reducer[value];
    if (
      typeof value.initialfn === `string` &&
      typeof value.reducefn === `string`
    ) {
      const parsed = { name: value.name } as Reducer;
      parsed.initialfn = eval(value.initialfn);
      parsed.reducefn = eval(value.reducefn);
      return parsed;
    }

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

    const index = Getter.of(indices);
    const value = Getter.of(values);

    for (let i = 0; i < indices.length; i++) {
      const ii = index(i);
      array[ii] = reducefn(array[ii], value(i));
    }

    const result = Reduced.of(array, factor, reducer);
    if (isObject(values)) Meta.copy(values, result);

    const name = getName(array, reducer) ?? `[unknown summary]`;
    Meta.set(result, { name, queryable: true, reduced: true });

    return result;
  }

  export function getName(reducable: Indexable, reducer: Reducer) {
    if (!Meta.has(reducable, `name`)) return reducer.fallback;
    return `${reducer.name} of ${Meta.get(reducable, `name`)}`;
  }
}
