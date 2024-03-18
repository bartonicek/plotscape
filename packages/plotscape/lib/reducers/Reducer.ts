import { ReduceFn, just, sum, zero } from "utils";

export interface Reducer<T, U> {
  name: string;
  initialfn: () => U;
  reducefn: ReduceFn<T, U>;
}

export const sumReducer: Reducer<number, number> = {
  name: `sum`,
  initialfn: zero,
  reducefn: sum,
};

export const maxReducer: Reducer<number, number> = {
  name: `max`,
  initialfn: just(-Infinity),
  reducefn: Math.max,
};

export const pasteReducer: Reducer<number, string> = {
  name: `paste`,
  initialfn: just(``),
  reducefn: (prev, next) => prev + next.toString(),
};
