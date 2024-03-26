import { Named } from "../mixins/Named";
import { Expanse, isExpanseContinuous } from "../scales/Expanse";
import { Scale } from "../scales/Scale";
import { Dimension } from "../types";
import { Continuous } from "./Continuous";

export interface Variable<T = unknown, Dim = Dimension.Scalar> extends Named {
  n(): number;
  domain: Expanse<T>;
  valueAt(index: number, offset?: number): T;
  scaledAt(
    index: number,
    scale: Scale
  ): Dim extends Dimension.Scalar ? number : number[];
  clone(): Variable<T, Dim>;
}

export function isContinuous(variable: Variable): variable is Continuous {
  return isExpanseContinuous(variable.domain);
}
