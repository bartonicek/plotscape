import { Reactive } from "../Reactive";
import { copyValues, merge, subset } from "../utils/funs";
import { PARENTVALUES } from "../utils/symbols";
import { Dataframe, Flat, Indexable } from "../utils/types";
import { Factor } from "./Factor";
import { Reduced } from "./Reduced";
import { Reducer } from "./Reducer";

export namespace Summaries {
  type ReducerTuple<T = any, U = any> = readonly [Indexable<T>, Reducer<T, U>];
  type Data = Record<string | symbol, Indexable>;
  type TranslateFn<T extends Data> = (data: T) => Data;

  type ReactiveData<T extends Data> = T & Reactive;

  export function of<
    T extends Record<string, ReducerTuple>,
    U extends readonly Factor[]
  >(summaries: T, factors: U) {
    const result = [] as any[];

    for (let i = 0; i < factors.length; i++) {
      const factor = factors[i];
      const computed = compute(factor, summaries);
      const summarized = Reactive.of(merge(computed, factor.data));

      result.push(summarized);

      if (i === 0) {
        Factor.listen(factor, `changed`, () => {
          const newComputed = compute(factor, summaries);

          for (const k of Object.keys(newComputed)) {
            copyValues(newComputed[k], computed[k]);
          }

          Reactive.dispatch(summarized, `changed`);
        });
        continue;
      }

      if (factor.parent && factor.parentIndices) {
        for (const k of Object.keys(computed)) {
          const parentValues = subset(result[i - 1][k], factor.parentIndices);
          computed[k][PARENTVALUES] = parentValues;
        }

        Factor.listen(factor, `changed`, () => {
          const newComputed = compute(factor, summaries);

          for (const k of Object.keys(computed)) {
            copyValues(newComputed[k], computed[k]);

            const par = result[i - 1][k];
            const parentValues = subset(par, factor.parentIndices!);
            copyValues(parentValues, computed[k][PARENTVALUES]);
          }

          Reactive.dispatch(summarized, `changed`);
        });
      }
    }

    type Computed = {
      [key in keyof T]: Reduced<ReturnType<T[key][1]["reducefn"]>>;
    };

    return result as { [key in keyof U]: Flat<U[key]["data"] & Computed> };
  }

  function compute<
    T extends Dataframe,
    U extends Record<string, ReducerTuple<T>>
  >(factor: Factor<T>, summaries: U) {
    const computed = {} as Record<string, any>;

    for (const [k, v] of Object.entries(summaries)) {
      const [indexable, reducer] = v;
      computed[k] = Reducer.reduce(indexable, factor, reducer);
    }

    type Computed = {
      [key in keyof U]: Reduced<ReturnType<U[key][1]["reducefn"]>>;
    };

    return computed as Computed;
  }

  export function translate<
    T extends readonly Data[],
    U extends { [key in keyof T]: TranslateFn<T[key]> }
  >(data: T, translatefns: U) {
    const result = [];

    for (let i = 0; i < data.length; i++) {
      const translated = compute(data[i]);
      result.push(translated);

      Reactive.listen(data[i] as any, `changed`, () => {
        const newTranslated = compute(data[i]);

        for (const k of Reflect.ownKeys(newTranslated)) {
          if (Array.isArray(newTranslated[k]) && Array.isArray(translated[k])) {
            copyValues(newTranslated[k], translated[k]);
          }
        }
      });

      function compute(data: Data) {
        const computed = translatefns[i](data);
        for (const s of Object.getOwnPropertySymbols(data)) {
          computed[s] = data[s];
        }
        return computed;
      }
    }

    return result as { [key in keyof U]: ReturnType<U[key]> };
  }
}
