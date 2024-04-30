import { mix } from "../funs";
import { Indexable, indexable } from "../mixins/Indexable";
import { Named, named } from "../mixins/Named";
import { Proxyable, proxyable } from "../mixins/Proxyable";
import { Queryable, queryable } from "../mixins/Queryable";
import { ShallowCloneable, shallowCloneable } from "../mixins/ShallowClonable";
import { Expanse } from "../scales/Expanse";
import { newExpanseContinuous } from "../scales/ExpanseContinuous";
import { Variable, injectQueryInfo } from "./Variable";

/** Returns any kind of value by index. */
export interface Reference<T = unknown>
  extends Named,
    Queryable,
    ShallowCloneable,
    Variable<T>,
    Indexable<T>,
    Proxyable<T> {
  clone<T>(): Reference<T>;
}

export function newReference<T>(values: T[]): Reference<T> {
  const tag = `Reference`;
  const domain = newExpanseContinuous() as unknown as Expanse<T>;
  const props = { array: values, domain, [Symbol.toStringTag]: tag };
  const methods = { clone, injectQueryInfo };
  const self = mix({ ...props, ...methods })
    .with(named)
    .with(queryable)
    .with(shallowCloneable)
    .with(indexable)
    .with(proxyable);

  return self;
}

function clone<T>(this: Reference<T>) {
  const array = [...this.array];
  const copy = newReference(array);
  if (this.hasName()) copy.setName(this.name());
  copy.setQueryable(this.isQueryable());
  return copy;
}
