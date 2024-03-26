import { minMax } from "utils";
import { ExpanseContinuous, newExpanseContinuous } from "../ExpanseContinuous";
import { Indexable, indexable } from "../mixins/Indexable";
import { Named, named } from "../mixins/Named";
import { Proxyable, proxyable } from "../mixins/Proxyable";
import { Reduced } from "../reducers/Reduced";

export interface Continuous
  extends Named,
    Indexable<number>,
    Proxyable<number>,
    Reduced {
  domain: ExpanseContinuous;
  clone(): Continuous;
  range(): number;
  min(): number;
  max(): number;
}

export function newContinuous(array: number[], domain?: ExpanseContinuous) {
  domain = domain ?? newExpanseContinuous(...minMax(array));

  const props = { array, domain };
  const methods = { range, min, max, clone };
  const self = { ...props, ...methods };

  return proxyable(indexable(named(self))) as Continuous;
}

function clone(this: Continuous) {
  const array = [...this.array];
  const copy = newContinuous(array);
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
