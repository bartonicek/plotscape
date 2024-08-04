import { isArray } from "./utils/funs";
import { Indexable } from "./utils/types";

export namespace Getter {
  export function of<T>(indexable: Indexable<T>) {
    if (isArray(indexable)) return (index: number) => indexable[index];
    else if (typeof indexable === "function") {
      return indexable as (index: number) => T;
    }
    return () => indexable;
  }
}
