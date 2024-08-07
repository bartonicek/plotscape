import { copyValues, isArray } from "../utils/funs";
import { Reactive } from "../utils/Reactive";
import { Dataframe } from "../utils/types";

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
  ? [ReturnType<U>, ...TranslatedData<Rest>]
  : [];

const SUMMARIES = Symbol(`summaries`);
const TRANSLATEFNS = Symbol(`translatefns`);

export namespace Translated {
  export function of<T extends readonly Dataframe[], U extends TranslateFns<T>>(
    data: T,
    translatefns: U,
  ): TranslatedData<U> {
    const result = [] as any[];
    (result as any)[TRANSLATEFNS] = translatefns;
    (result as any)[SUMMARIES] = data;

    for (let i = 0; i < data.length; i++) {
      const translated = compute(data[i]);
      result.push(translated);

      Reactive.listen(data[i] as any, `changed`, () => {
        const newTranslated = compute(data[i]);

        for (const k of Reflect.ownKeys(newTranslated)) {
          if (isArray(newTranslated[k]) && isArray(translated[k])) {
            copyValues(newTranslated[k], translated[k]);
          }
        }
      });

      function compute(data: Dataframe) {
        const computed = (result as any)[TRANSLATEFNS][i](data);
        const symbols = Object.getOwnPropertySymbols(data);
        for (const s of symbols) computed[s] = data[s];
        return computed;
      }
    }

    return result as TranslatedData<U>;
  }

  export function setTranslateFn(data: any, translatefns: TranslateFn[]) {
    data[TRANSLATEFNS] = translatefns;
    Reactive.dispatch(data[SUMMARIES][0], `changed`);
  }
}
