import {
  applyDirection,
  compareAlphaNumeric,
  copyValues,
  ordered,
} from "../utils/funs";
import { Poly } from "../utils/Poly";
import { Reactive } from "../utils/Reactive";
import { Direction, Stringable } from "../utils/types";
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
  const type = `point` as const;

  export function of(
    labels: Stringable[] = [],
    options?: { zero?: number; one?: number; direction?: Direction },
  ): ExpansePoint {
    const value = ``;
    const labs = labels.map((x) => x.toString());

    const base = Expanse.base(options);
    const order = Array.from(Array(labels.length), (_, i) => i);
    const ordered = false;
    const vals = { labels: labs, order, ordered };
    const defaults = { ...base.defaults, ...structuredClone(vals) };

    return { ...base, ...vals, value, type, defaults };
  }

  // Expanse method implementations
  Poly.set(Expanse.normalize, type, normalize);
  Poly.set(Expanse.unnormalize, type, unnormalize);
  Poly.set(Expanse.train, type, train);
  Poly.set(Expanse.breaks, type, breaks);
  Poly.set(Expanse.reorder, type, reorder);

  function normalize(expanse: ExpansePoint, value: string) {
    const { labels, order, zero, one, direction } = expanse;
    const index = order[labels.indexOf(value)];
    if (index === -1) return index;

    const pct = zero + (index / (labels.length - 1)) * (one - zero);
    return applyDirection(pct, direction);
  }

  function unnormalize(expanse: ExpansePoint, value: number) {
    const { labels, order, zero, one, direction } = expanse;
    value = applyDirection(value, direction);
    const pct = (value - zero) / (one - zero);
    const index = Math.round(pct * (labels.length - 1));
    return labels[order[index]];
  }

  function train(
    expanse: ExpansePoint,
    array: string[],
    options?: { default?: boolean; silent?: boolean },
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
    Expanse.set(expanse, () => {}, options); // To trigger event listeners
  }

  function reorder(expanse: ExpansePoint, indices?: number[]) {
    const { order, defaults } = expanse;

    if (!indices) {
      copyValues(defaults.order, order);
      expanse.ordered = false;
      Reactive.dispatch(expanse, `changed`);
      return;
    }

    copyValues(indices, order);
    expanse.ordered = true;
    Reactive.dispatch(expanse, `changed`);
  }

  function breaks(expanse: ExpansePoint) {
    return ordered(expanse.labels, expanse.order);
  }
}
