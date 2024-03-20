import { Expanse } from "../Expanse";
import { newExpanseContinuous } from "../ExpanseContinuous";
import { Indexable, indexable } from "../mixins/Indexable";
import { Named, named } from "../mixins/Named";
import { Proxyable, proxyable } from "../mixins/Proxyable";
import { Variable } from "./Variable";

export interface Reference<T = unknown>
  extends Named,
    Variable<T>,
    Indexable<T>,
    Proxyable<T> {}

export function newReference<T>(values: T[]): Reference<T> {
  const domain = newExpanseContinuous() as unknown as Expanse<T>;
  return { ...proxyable(indexable(named({ array: values, domain }))) };
}
