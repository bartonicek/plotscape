import { applyDirection, compareAlphaNumeric, copyValues } from "../utils/funs";
import { Direction } from "../utils/types";
import { Expanse } from "./Expanse";

/** Converts string labels to the [0, 1] interval and back, such that each value is placed
 * equidistantly along the interval, and the first label is placed at 0 and the last at 1.
 */
export interface ExpansePoint extends Expanse<string> {
  type: Expanse.Type.Point;

  labels: string[];
  sorted: boolean;

  defaults: {
    labels: string[];
    sorted: boolean;
    zero: number;
    one: number;
    direction: Direction;
  };
}

export namespace ExpansePoint {
  export function of(
    labels: string[] = [],
    options?: { zero?: number; one?: number; direction?: Direction },
  ): ExpansePoint {
    const value = ``;
    const type = Expanse.Type.Point;

    const base = Expanse.base(options);
    const { zero, one, direction } = base;
    const sorted = false;
    const defaults = { labels: [...labels], sorted, zero, one, direction };

    return { value, type, labels, sorted, ...base, defaults };
  }

  export function normalize(expanse: ExpansePoint, value: string) {
    const { labels, zero, one, direction } = expanse;
    const index = labels.indexOf(value);
    if (index === -1) return index;

    const pct = zero + (index / (labels.length - 1)) * (one - zero);
    return applyDirection(pct, direction);
  }

  export function unnormalize(expanse: ExpansePoint, value: number) {
    const { labels, zero, one, direction } = expanse;
    value = applyDirection(value, direction);
    const pct = (value - zero) / (one - zero);
    const index = Math.round(pct * (labels.length - 1));
    return labels[index];
  }

  export function train(
    expanse: ExpansePoint,
    array: string[],
    options?: { default?: boolean },
  ) {
    const labels = Array.from(new Set(array)).sort(compareAlphaNumeric);
    copyValues(labels, expanse.labels);
    if (options?.default) copyValues(labels, expanse.defaults.labels);
  }

  export function reorder(expanse: ExpansePoint, indices?: number[]) {
    const { labels } = expanse;

    if (!indices) {
      labels.sort(compareAlphaNumeric);
      expanse.sorted = false;
      Expanse.dispatch(expanse, `changed`);
      return;
    }

    const temp = Array(labels.length);
    for (let i = 0; i < indices.length; i++) temp[i] = labels[indices[i]];
    for (let i = 0; i < temp.length; i++) labels[i] = temp[i];
    expanse.sorted = true;
    Expanse.dispatch(expanse, `changed`);
  }

  export function breaks(expanse: ExpansePoint) {
    return expanse.labels;
  }
}
