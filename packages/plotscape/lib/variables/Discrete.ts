import { compareAlphaNumeric } from "utils";
import {
  ExpanseDiscreteWeighted,
  newExpanseDiscreteWeighted,
} from "../ExpanseDiscreteWeighted";
import { Indexable, indexable } from "../mixins/Indexable";
import { Named, named } from "../mixins/Named";
import { Proxyable, proxyable } from "../mixins/Proxyable";
import { Variable } from "./Variable";

export interface Discrete
  extends Named,
    Variable<string>,
    Indexable<string>,
    Proxyable<string> {
  domain: ExpanseDiscreteWeighted;
}

export function newDiscrete(array: string[], domain?: ExpanseDiscreteWeighted) {
  const unique = Array.from(new Set(array)).sort(compareAlphaNumeric);
  domain = domain ?? newExpanseDiscreteWeighted(unique);
  return proxyable(indexable(named({ array, domain }))) as Discrete;
}
