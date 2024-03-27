import { mix } from "../funs";
import { Indexable, indexable } from "../mixins/Indexable";
import { Named, named } from "../mixins/Named";
import { Proxyable, proxyable } from "../mixins/Proxyable";
import { Expanse } from "../scales/Expanse";
import { newExpanseContinuous } from "../scales/ExpanseContinuous";
import { Variable } from "./Variable";

export interface Reference<T = unknown>
  extends Named,
    Variable<T>,
    Indexable<T>,
    Proxyable<T> {
  clone<T>(): Reference<T>;
}

export function newReference<T>(values: T[]): Reference<T> {
  const domain = newExpanseContinuous() as unknown as Expanse<T>;

  const props = { array: values, domain };
  const methods = { clone };
  const self = { ...props, ...methods };

  return mix(self).with(named).with(indexable).with(proxyable);
}

function clone<T>(this: Reference<T>) {
  const array = [...this.array];
  const copy = newReference(array);
  return copy;
}
