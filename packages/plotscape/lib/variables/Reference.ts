import { Expanse } from "../Expanse";
import { newExpanseContinuous } from "../ExpanseContinuous";
import { Indexable, indexable } from "../mixins/Indexable";
import { Named, named } from "../mixins/Named";
import { Proxyable, proxyable } from "../mixins/Proxyable";

export interface Reference<T = unknown>
  extends Named,
    Indexable<T>,
    Proxyable<T> {
  clone<T>(): Reference<T>;
}

export function newReference<T>(values: T[]): Reference<T> {
  const domain = newExpanseContinuous() as unknown as Expanse<T>;

  const props = { array: values, domain };
  const methods = { clone };
  const self = { ...props, ...methods };

  return proxyable(indexable(named(self))) as Reference<T>;
}

function clone<T>(this: Reference<T>) {
  const array = [...this.array];
  const copy = newReference(array) as Reference<T>;
  return copy;
}
