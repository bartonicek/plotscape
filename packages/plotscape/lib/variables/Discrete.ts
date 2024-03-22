import { compareAlphaNumeric } from "utils";
import {
  ExpanseDiscreteWeighted,
  newExpanseDiscreteWeighted,
} from "../ExpanseDiscreteWeighted";
import { Indexable, indexable } from "../mixins/Indexable";
import { Named, named } from "../mixins/Named";
import { Proxyable, proxyable } from "../mixins/Proxyable";
import { Derived, newDerived } from "./Derived";

export interface Discrete extends Named, Indexable<string>, Proxyable<string> {
  domain: ExpanseDiscreteWeighted;
  clone(): this;
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
  const derivefn = (i: number, v?: Discrete) => v!.domain.width(v!.valueAt(i));
  return newDerived(derivefn as any, this as any);
}
