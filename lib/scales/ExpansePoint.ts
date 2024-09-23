import {
  applyDirection,
  compareAlphaNumeric,
  copyValues,
  ordered,
  seqLength,
} from "../utils/funs";
import { Poly } from "../utils/Poly";
import { Reactive } from "../utils/Reactive";
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
  };
}

export namespace ExpansePoint {
  const type = `point`;

  export interface Props {
    ordered: boolean;
    labels: string[];
    order: number[];
  }

  export function of(
    labels: string[] = [],
    options?: { zero?: number; one?: number; direction?: Direction },
  ): ExpansePoint {
    const value = ``;

    const base = Expanse.base();
    const [ordered, order] = [false, seqLength(0, labels.length)];
    const vals = { labels, ordered, order };

    const defaults = { ordered, labels: [...labels], order: [...order] };

    return { type, value, ...base, ...vals, defaults };
  }

  // Expanse methods implementations
  Poly.set(Expanse.normalize, type, normalize);
  Poly.set(Expanse.unnormalize, type, unnormalize);
  Poly.set(Expanse.train, type, train);
  Poly.set(Expanse.breaks, type, breaks);
  Poly.set(Expanse.reorder, type, reorder);

  export function normalize(expanse: ExpansePoint, value: string) {
    const { labels, order, zero, one, direction } = expanse;
    const index = order[labels.indexOf(value)];
    if (index === -1) return index;

    let result = index / (labels.length - 1);
    result = zero + result * (one - zero);
    result = applyDirection(result, direction);

    return result;
  }

  export function unnormalize(expanse: ExpansePoint, value: number) {
    const { labels, order, zero, one, direction } = expanse;

    let result = applyDirection(value, direction);
    result = (result - zero) / (one - zero);
    result = Math.round(result * (labels.length - 1));

    return labels[order[result]];
  }

  export function train(
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
    Expanse.set(expanse, () => {}, options); // Trigger listeners
  }

  export function reorder(expanse: ExpansePoint, indices?: number[]) {
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

  export function breaks(expanse: ExpansePoint) {
    return ordered(expanse.labels, expanse.order);
  }
}
