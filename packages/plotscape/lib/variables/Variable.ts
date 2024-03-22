import { Scale } from "../Scale";
import { Named } from "../mixins/Named";

export interface Variable<T = unknown> extends Named {
  n?(): number;
  valueAt(index: number): T;
  scaledAt(index: number, scale: Scale<T>): number;
  clone(): this;
}
