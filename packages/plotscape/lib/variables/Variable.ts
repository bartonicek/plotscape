import { Dict } from "utils";
import { colors } from "../main";
import { Named } from "../mixins/Named";
import { Queryable } from "../mixins/Queryable";
import { Expanse } from "../scales/Expanse";
import { isExpanseContinuous } from "../scales/ExpanseContinuous";
import { Scale } from "../scales/Scale";
import { Continuous } from "./Continuous";

/** Returns values by index. Can also scale that value when given a scale. */
export interface Variable<T = unknown> extends Named, Queryable {
  domain: Expanse<T>;
  n(): number;
  clone(): Variable<T>;
  valueAt(index: number, offset?: number): T;
  scaledAt(index: number, scale: Scale<T>): number;
  injectQueryInfo(
    index: number,
    infoDict: Dict,
    options?: Record<string, any>
  ): void;
}

export function isContinuous(variable: Variable): variable is Continuous {
  return isExpanseContinuous(variable.domain);
}

export function injectQueryInfo(
  this: Variable,
  index: number,
  infoDict: Dict,
  options?: Record<string, any>
) {
  if (!this.hasName() || !this.isQueryable()) return;
  let [key, value] = [this.name(), this.valueAt(index)];

  if (options?.colour) {
    const col = colors[options.colour];
    const fontCol = options.colour < 4 ? `white` : `black`;
    key = `<span style="color:${fontCol};background-color:${col}">${key}</span>`;
  }

  infoDict[key] = value;
}
