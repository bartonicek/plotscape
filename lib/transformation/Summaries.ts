import { Dataframe } from "../utils/Dataframe";
import { Indexable } from "../utils/Indexable";
import { Reactive } from "../utils/Reactive";
import { copyValues, isIntegerString, merge } from "../utils/funs";
import { Columns, Flat } from "../utils/types";
import { Factor } from "./Factor";
import { Reduced } from "./Reduced";
import { Reducer } from "./Reducer";

type ReducerTuple<T = any, U = any> = readonly [Indexable<T>, Reducer<T, U>];
type Computed<T extends Record<string, ReducerTuple>> = {
  [key in keyof T]: Reduced<ReturnType<T[key][1][`reducefn`]>>;
} & Reactive;

type TranslateFn<T extends Dataframe = any> = (data: T) => Dataframe;
type TranslateFns<T extends readonly Dataframe[]> = T extends readonly [
  infer U extends Dataframe,
  ...infer Rest extends readonly Dataframe[],
]
  ? [TranslateFn<U>, ...TranslateFns<Rest>]
  : [];

type TranslatedData<T extends TranslateFn[]> = T extends [
  infer U extends TranslateFn,
  ...infer Rest extends TranslateFn[],
]
  ? [ReturnType<U> & Reactive, ...TranslatedData<Rest>]
  : [];

export namespace Summaries {
  export function of<
    T extends Record<string, ReducerTuple>,
    U extends readonly Factor[],
  >(summaries: T, factors: U) {
    const result = [] as any[];

    for (let i = 0; i < factors.length; i++) {
      const factor = factors[i];
      const summarized = compute(summaries, factor);
      const data = Reactive.of()(merge(summarized, factor.data));

      result.push(data);

      if (i > 0) {
        for (const k of Object.keys(summarized)) {
          const parent = result[i - 1][k];
          Reduced.setParent(summarized[k], parent);
        }
      }

      Reactive.listen(factor, `changed`, () => {
        const newSummarized = compute(summaries, factor);

        for (const k of Object.keys(newSummarized)) {
          copyValues(newSummarized[k], summarized[k]);
        }

        for (const k of Reflect.ownKeys(factor.data)) {
          copyValues(factor.data[k], data[k]);
        }
      });

      // Need to dispatch only AFTER parent values have been updated
      Reactive.propagate(factor, data, `changed`);
    }

    return result as { [key in keyof U]: Flat<U[key]["data"] & Computed<T>> };
  }

  function compute<
    T extends Dataframe,
    U extends Record<string, ReducerTuple<T>>,
  >(summaries: U, factor: Factor<T>) {
    const computed = {} as Record<string, any>;

    for (const [k, v] of Object.entries(summaries)) {
      const [indexable, reducer] = v;
      computed[k] = Reducer.reduce(indexable, factor, reducer);
    }

    return computed as Computed<U>;
  }

  export function translate<
    T extends readonly Dataframe[],
    U extends TranslateFns<T>,
  >(data: T, translatefns: U) {
    const result = [] as any[];

    for (let i = 0; i < data.length; i++) {
      const translated = Reactive.of()(compute(data[i]));
      result.push(translated);

      Reactive.listen(data[i] as any, `changed`, () => {
        const newTranslated = compute(data[i]);

        for (const k of Reflect.ownKeys(newTranslated)) {
          if (Array.isArray(newTranslated[k]) && Array.isArray(translated[k])) {
            copyValues(newTranslated[k], translated[k]);
          }
        }

        Reactive.dispatch(translated, `changed`);
      });

      function compute(data: Dataframe) {
        const computed = translatefns[i](data);
        const keys = Reflect.ownKeys(data);

        for (const key of keys) {
          if (typeof key === `symbol`) computed[key] = data[key];
          else if (isIntegerString(key)) computed[key] = data[key];
        }

        return computed;
      }
    }

    return result as TranslatedData<U>;
  }

  export function formatQueries<T extends Columns>(
    queries: [(data: T) => any[], Reducer][],
    data: T,
  ) {
    const result = {} as Record<string, any>;
    let i = 0;

    for (const [selectfn, reducer] of queries) {
      result[`q${i++}`] = [selectfn(data), reducer];
    }

    return result;
  }
}
