import { minMax } from "utils";
import { ExpanseContinuous, newExpanseContinuous } from "../ExpanseContinuous";
import { indexable } from "../mixins/Indexable";
import { named } from "../mixins/Named";
import { proxyable } from "../mixins/Proxyable";
import { Variable } from "./Variable";

export interface Continuous extends Variable<number> {
  domain: ExpanseContinuous;
}

export function newContinuous(
  values: number[],
  domain?: ExpanseContinuous
): Continuous {
  const [min, max] = minMax(values);
  domain = domain ?? newExpanseContinuous(min, max);

  return proxyable(indexable(named({ array: values, domain })));
}
