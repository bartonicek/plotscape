import { compareAlphaNumeric } from "utils";
import { mix } from "../funs";
import { Indexable, indexable } from "../mixins/Indexable";
import { Named, named } from "../mixins/Named";
import { Proxyable, proxyable } from "../mixins/Proxyable";
import { Queryable, queryable } from "../mixins/Queryable";
import { Reduced, reduced } from "../mixins/Reduced";
import {
  ExpanseDiscreteWeighted,
  newExpanseDiscreteWeighted,
} from "../scales/ExpanseDiscreteWeighted";
import { Variable, injectQueryInfo } from "./Variable";

export interface Discretizable extends Variable {
  toDiscrete(): Discrete;
}

/** Returns string values by index. */
export interface Discrete
  extends Named,
    Queryable,
    Variable<string>,
    Indexable<string>,
    Proxyable<string>,
    Reduced<string> {
  domain: ExpanseDiscreteWeighted;
  clone(): this;
  width(): Discrete;
  toDiscrete(): Discrete;
}

export function newDiscrete(
  array: string[],
  domain?: ExpanseDiscreteWeighted
): Discrete {
  const unique = Array.from(new Set(array)).sort(compareAlphaNumeric);
  const tag = `Discrete`;
  domain = domain ?? newExpanseDiscreteWeighted(unique);

  const props = { array, domain, [Symbol.toStringTag]: tag };
  const methods = { width, clone, injectQueryInfo, toDiscrete };

  const self = mix({ ...props, ...methods })
    .with(named)
    .with(queryable)
    .with(indexable)
    .with(proxyable)
    .with(reduced);

  return self;
}

function clone(this: Discrete) {
  const array = [...this.array];
  const copy = newDiscrete(array) as Discrete;
  copy.domain = this.domain.clone();
  if (this.hasName()) copy.setName(this.name());
  copy.setQueryable(this.isQueryable());
  return copy;
}

function width(this: Discrete) {
  const copy = this.clone();
  copy.domain = this.domain.getWidthExpanse();
  return copy;
}

function toDiscrete(this: Discrete) {
  return this;
}
