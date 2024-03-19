import { Expanse } from "../Expanse";
import { newExpanseContinuous } from "../ExpanseContinuous";
import { indexable } from "../mixins/Indexable";
import { named } from "../mixins/Named";
import { proxyable } from "../mixins/Proxyable";
import { Variable } from "./Variable";

export interface Reference<T = unknown> extends Variable<T> {}

export function newReference<T>(values: T[]): Reference<T> {
  const domain = newExpanseContinuous() as unknown as Expanse<T>;
  return { ...proxyable(indexable(named({ array: values, domain }))) };
}
