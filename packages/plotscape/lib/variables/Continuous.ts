import { minMax } from "utils";
import { ExpanseContinuous, newExpanseContinuous } from "../ExpanseContinuous";
import { Indexable, indexable } from "../mixins/Indexable";
import { Named, named } from "../mixins/Named";
import { Proxyable, proxyable } from "../mixins/Proxyable";
import { Variable } from "./Variable";

export interface Continuous
  extends Named,
    Variable<number>,
    Indexable<number>,
    Proxyable<number> {
  domain: ExpanseContinuous;
  stack?(): this;
  normalizeByParent?(): this;
  range(): number;
  min(): number;
  max(): number;
}

export function newContinuous(array: number[], domain?: ExpanseContinuous) {
  domain = domain ?? newExpanseContinuous(...minMax(array));

  const props = { array, domain };
  const methods = { range, min, max };
  const self = { ...props, ...methods };

  return proxyable(indexable(named(self))) as Continuous;
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
