import { makeGetter } from "../utils/funs";
import { Indexable, ReduceFn } from "../utils/types";
import { Factor } from "./Factor";
import { Reduced } from "./Reduced";

export type Reducer<T, U> = {
  name: string;
  initialfn: () => U;
  reducefn: ReduceFn<T, U>;
};

export namespace Reducer {
  export const sum = {
    name: `sum`,
    initialfn: () => 0,
    reducefn: (x: number, y: number) => x + y,
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
