import { applyDirection } from "../utils/funs";
import { Direction } from "../utils/types";
import { Expanse } from "./Expanse";
import { ExpansePoint } from "./ExpansePoint";

/**
 * Converts string labels to the [0, 1] interval and back, such that each
 * label is placed in the middle of its corresponding bin.
 */
export interface ExpanseBand extends Expanse<string> {
  type: Expanse.Type.Band;

  labels: string[];
  weights?: number[];
}

export namespace ExpanseBand {
  type Options = {
    weights?: number[];
    zero?: number;
    one?: number;
    direction?: Direction;
  };

  export function of(labels: string[] = [], options?: Options): ExpanseBand {
    const value = ``;
    const type = Expanse.Type.Band;

    const base = Expanse.base(options);
    const { zero, one, direction } = base;
    const weights = options?.weights ?? Array(labels.length).fill(1);

    const defaults = {
      labels: [...labels],
      weights: [...weights],
      zero,
      one,
      direction,
    };

    return { value, type, labels, weights, ...base, defaults };
  }

  export function normalize(expanse: ExpanseBand, value: string) {
    const { labels, zero, one, direction } = expanse;

    const index = labels.indexOf(value);
    if (index === -1) return index;

    const midpoint = (index + (index + 1)) / 2;
    const pct = zero + (midpoint / labels.length) * (one - zero);

    return applyDirection(pct, direction);
  }

  export function unnormalize(expanse: ExpanseBand, value: number) {
    const { labels, zero, one, direction } = expanse;

    value = applyDirection(value, direction);
    const pct = (value - zero) / (one - zero);
    const index = Math.round((2 * pct * labels.length - 1) / 2);

    return labels[index];
  }

  export const train = ExpansePoint.train;
  export const breaks = ExpansePoint.breaks;
  export const reorder = ExpansePoint.reorder;
}
