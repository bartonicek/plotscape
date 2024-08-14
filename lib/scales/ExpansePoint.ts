import {
  applyDirection,
  compareAlphaNumeric,
  copyValues,
  ordered,
} from "../utils/funs";
import { Direction } from "../utils/types";
import { Expanse } from "./Expanse";

/** Converts string labels to the [0, 1] interval and back, such that each value is placed
 * equidistantly along the interval, and the first label is placed at 0 and the last at 1.
 */
export interface ExpansePoint extends Expanse<string> {
  type: `point`;

  ordered: boolean;
  labels: string[];
  order: number[];

  defaults: {
    ordered: boolean;
    labels: string[];
    order: number[];
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
    const type = `point`;

    const base = Expanse.base(options);
    const { zero, one, direction } = base;
    const order = Array.from(Array(labels.length), (_, i) => i);
    const ordered = false;

    const defaults = {
      ordered,
      labels: [...labels],
      order: [...order],
      zero,
      one,
      direction,
    };

    return { value, type, ordered, labels, order, ...base, defaults };
  }

  export function normalize(expanse: ExpansePoint, value: string) {
    const { labels, order, zero, one, direction } = expanse;
    const index = order[labels.indexOf(value)];
    if (index === -1) return index;

    const pct = zero + (index / (labels.length - 1)) * (one - zero);
    return applyDirection(pct, direction);
  }

  export function unnormalize(expanse: ExpansePoint, value: number) {
    const { labels, order, zero, one, direction } = expanse;
    value = applyDirection(value, direction);
    const pct = (value - zero) / (one - zero);
    const index = Math.round(pct * (labels.length - 1));
    return labels[order[index]];
  }

  export function train(
    expanse: ExpansePoint,
    array: string[],
    options?: { default?: boolean },
  ) {
    const { order } = expanse;
    const labels = Array.from(new Set(array)).sort(compareAlphaNumeric);

    if (!order.length) {
      for (let i = 0; i < labels.length; i++) order[i] = i;
      expanse.defaults.order = [...order];
      expanse.ordered = false;
    }

    copyValues(labels, expanse.labels);
    if (options?.default) copyValues(labels, expanse.defaults.labels);
  }

  export function reorder(expanse: ExpansePoint, indices?: number[]) {
    const { order, defaults } = expanse;

    if (!indices) {
      copyValues(defaults.order, order);
      expanse.ordered = false;
      Expanse.dispatch(expanse, `changed`);
      return;
    }

    copyValues(indices, order);
    expanse.ordered = true;
    Expanse.dispatch(expanse, `changed`);
  }

  export function breaks(expanse: ExpansePoint) {
    return ordered(expanse.labels, expanse.order);
  }
}
