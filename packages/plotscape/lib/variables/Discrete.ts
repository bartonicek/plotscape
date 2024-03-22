import { compareAlphaNumeric } from "utils";
import {
  ExpanseDiscreteWeighted,
  newExpanseDiscreteWeighted,
} from "../ExpanseDiscreteWeighted";
import { Indexable, indexable } from "../mixins/Indexable";
import { Named, named } from "../mixins/Named";
import { Proxyable, proxyable } from "../mixins/Proxyable";
import { Derived, newDerived } from "./Derived";
import { Variable } from "./Variable";

export interface Discrete
  extends Named,
    Variable<string>,
    Indexable<string>,
    Proxyable<string> {
  domain: ExpanseDiscreteWeighted;
  width(): Derived<number>;
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
  return copy;
}

function width(this: Discrete) {
  const derivefn = (i: number, v?: Variable<string>) =>
    (v as Discrete).domain.width(v!.valueAt(i));
  return newDerived(derivefn, this);
}
