import { minMax } from "utils";
import { mix } from "../funs";
import { Indexable, indexable } from "../mixins/Indexable";
import { Named, named } from "../mixins/Named";
import { Proxyable, proxyable } from "../mixins/Proxyable";
import { Queryable, queryable } from "../mixins/Queryable";
import { Reduced, reduced } from "../mixins/Reduced";
import {
  ExpanseContinuous,
  newExpanseContinuous,
} from "../scales/ExpanseContinuous";
import { Variable, injectQueryInfo } from "./Variable";

/** Returns numeric values by index. */
export interface Continuous
  extends Named,
    Queryable,
    Variable<number>,
    Indexable<number>,
    Proxyable<number>,
    Reduced<number> {
  domain: ExpanseContinuous;
  clone(): Continuous;
  range(): number;
  min(): number;
  max(): number;
}

export function newContinuous(
  array: number[],
  domain?: ExpanseContinuous
): Continuous {
  const tag = `Continuous`;
  domain = domain ?? newExpanseContinuous(...minMax(array));

  const props = { array, domain, [Symbol.toStringTag]: tag };
  const methods = { range, min, max, clone, injectQueryInfo };

  const self = mix({ ...props, ...methods })
    .with(named)
    .with(queryable)
    .with(indexable)
    .with(proxyable)
    .with(reduced);

  return self;
}

function clone(this: Continuous) {
  const array = [...this.array];
  const copy = newContinuous(array);
  copy.domain = this.domain.clone();
  if (this.hasName()) copy.setName(this.name());
  copy.setQueryable(this.isQueryable());
  return copy;
}

function min(this: Continuous) {
  return this.domain.min;
}

function max(this: Continuous) {
  return this.domain.max;
}

function range(this: Continuous) {
  return this.domain.range();
}
