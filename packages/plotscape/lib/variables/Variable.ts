import { Dict } from "utils";
import { Named } from "../mixins/Named";
import { Queryable } from "../mixins/Queryable";
import { ShallowCloneable } from "../mixins/ShallowClonable";
import { Expanse, isExpanseContinuous } from "../scales/Expanse";
import { Scale } from "../scales/Scale";
import { Continuous } from "./Continuous";

/** Returns values by index. Can also scale that value when given a scale. */
export interface Variable<T = unknown>
  extends Named,
    Queryable,
    ShallowCloneable {
  domain: Expanse<T>;
  n(): number;
  clone(): Variable<T>;
  valueAt(index: number, offset?: number): T;
  scaledAt(index: number, scale: Scale<T>): number;
  injectQueryInfo(index: number, infoDict: Dict): void;
}

export function isContinuous(variable: Variable): variable is Continuous {
  return isExpanseContinuous(variable.domain);
}

export function injectQueryInfo(this: Variable, index: number, infoDict: Dict) {
  if (!this.hasName() || !this.isQueryable()) return;
  infoDict[this.name()] = this.valueAt(index);
}
