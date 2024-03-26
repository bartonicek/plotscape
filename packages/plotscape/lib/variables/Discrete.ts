import { compareAlphaNumeric } from "utils";
import { Indexable, indexable } from "../mixins/Indexable";
import { Named, named } from "../mixins/Named";
import { Proxyable, proxyable } from "../mixins/Proxyable";
import {
  ExpanseDiscreteWeighted,
  newExpanseDiscreteWeighted,
} from "../scales/ExpanseDiscreteWeighted";
import { Variable } from "./Variable";

export interface Discrete
  extends Named,
    Variable<string>,
    Indexable<string>,
    Proxyable<string> {
  domain: ExpanseDiscreteWeighted;
  clone(): this;
  width(): Discrete;
}

export function newDiscrete(array: string[], domain?: ExpanseDiscreteWeighted) {
  const unique = Array.from(new Set(array)).sort(compareAlphaNumeric);
  domain = domain ?? newExpanseDiscreteWeighted(unique);

  const props = { array, domain };
  const methods = { width, clone };
  const self = { ...props, ...methods };

  return proxyable(indexable(named(self))) as Discrete;
}

function clone(this: Discrete) {
  const array = [...this.array];
  const copy = newDiscrete(array) as Discrete;
  copy.domain = this.domain.clone();
  return copy;
}

function width(this: Discrete) {
  const copy = this.clone();
  copy.domain = this.domain.getWidthExpanse();
  return copy;
}
