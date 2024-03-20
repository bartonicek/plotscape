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
  stack?(): this;
  normalizeByParent?(): this;
}

export function newContinuous(array: number[], domain?: ExpanseContinuous) {
  const [min, max] = minMax(array);
  domain = domain ?? newExpanseContinuous(min, max);
  return proxyable(indexable(named({ array, domain }))) as Continuous;
}
