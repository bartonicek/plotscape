import { Named } from "../mixins/Named";
import { Expanse, isExpanseContinuous } from "../scales/Expanse";
import { Scale } from "../scales/Scale";
import { Continuous } from "./Continuous";

/** Returns values by index. Can also scale that value when given a scale. */
export interface Variable<T = unknown> extends Named {
  domain: Expanse<T>;
  n(): number;
  valueAt(index: number, offset?: number): T;
  scaledAt(index: number, scale: Scale<T>): number;
  clone(): Variable<T>;
}

export function isContinuous(variable: Variable): variable is Continuous {
  return isExpanseContinuous(variable.domain);
}
