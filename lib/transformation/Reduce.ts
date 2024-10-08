import { Indexable } from "../utils/Indexable";
import { Metadata } from "../utils/Metadata";
import { Reducer } from "./Reducer";

export namespace Reduce {
  export function sum(values: Indexable<number>) {
    const result = Indexable.clone(values);
    Metadata.copy(values, result);
    Metadata.set(result, { reducer: Reducer.sum });
    return result;
  }
}
