import { compareAlphaNumeric } from "utils";
import {
  ExpanseDiscreteWeighted,
  newExpanseDiscreteWeighted,
} from "../ExpanseDiscreteWeighted";
import { indexable } from "../mixins/Indexable";
import { named } from "../mixins/Named";
import { proxyable } from "../mixins/Proxyable";
import { Variable } from "./Variable";

export interface Discrete extends Variable<string> {
  domain: ExpanseDiscreteWeighted;
}

export function newDiscrete(
  values: string[],
  domain?: ExpanseDiscreteWeighted
): Discrete {
  const unique = Array.from(new Set(values)).sort(compareAlphaNumeric);
  domain = domain ?? newExpanseDiscreteWeighted(unique);

  return proxyable(indexable(named({ array: values, domain })));
}
