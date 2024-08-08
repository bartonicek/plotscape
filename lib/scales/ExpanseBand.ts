import {
  applyDirection,
  compareAlphaNumeric,
  copyValues,
  cumsum,
  last,
} from "../utils/funs";
import { Direction } from "../utils/types";
import { Expanse } from "./Expanse";
import { ExpansePoint } from "./ExpansePoint";

/**
 * Converts string labels to the [0, 1] interval and back, such that each
 * label is placed in the middle of its corresponding bin.
 */
export interface ExpanseBand extends Expanse<string> {
  type: Expanse.Type.Band;

  sorted: boolean;
  labels: string[];
  cumulativeWeights: number[];
  weights: number[];

  defaults: {
    sorted: boolean;
    labels: string[];
    weights: number[];
    cumulativeWeights: number[];
    zero: number;
    one: number;
    direction: Direction;
  };
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
    const cumulativeWeights = cumsum(weights);
    const sorted = false;

    const defaults = {
      sorted,
      labels: [...labels],
      weights: [...weights],
      cumulativeWeights: [...cumulativeWeights],
      zero,
      one,
      direction,
    };

    return {
      value,
      type,
      sorted,
      labels,
      weights,
      cumulativeWeights,
      ...base,
      defaults,
    };
  }

  function getWeights(expanse: ExpanseBand, index: number) {
    const { cumulativeWeights: cWeights } = expanse;
    return [cWeights[index - 1] ?? 0, cWeights[index], last(cWeights)];
  }

  export function setWeights(expanse: ExpanseBand, weights?: number[]) {
    weights = weights ?? Array(expanse.labels.length).fill(1);

    if (weights.length != expanse.labels.length) {
      throw new Error(
        `The length of the weights must match the length of labels`,
      );
    }

    const cumulativeWeights = cumsum(weights);

    copyValues(weights, expanse.weights);
    copyValues(weights, expanse.defaults.weights);
    copyValues(cumulativeWeights, expanse.cumulativeWeights);
    copyValues(cumulativeWeights, expanse.defaults.cumulativeWeights);

    Expanse.dispatch(expanse, `changed`);
  }

  export function normalize(expanse: ExpanseBand, value: string) {
    const { labels, zero, one, direction } = expanse;

    const index = labels.indexOf(value);
    if (index === -1) throw new Error(`Label ${value} not found in: ${labels}`);

    const [lower, upper, max] = getWeights(expanse, index);
    const midpoint = (lower + upper) / 2 / max;
    const pct = zero + midpoint * (one - zero);

    return applyDirection(pct, direction);
  }

  export function unnormalize(expanse: ExpanseBand, value: number) {
    const { labels, zero, one, direction } = expanse;

    value = applyDirection(value, direction);
    const pct = (value - zero) / (one - zero);
    const index = Math.round((2 * pct * labels.length - 1) / 2);

    return labels[index];
  }

  export function train(
    expanse: ExpansePoint,
    array: string[],
    options?: { default?: boolean },
  ) {
    const labels = Array.from(new Set(array)).sort(compareAlphaNumeric);
    const weights = Array(labels.length).fill(1);
    const cumulativeWeights = cumsum(weights);

    const data = { labels, weights, cumulativeWeights };

    for (const [k, v] of Object.entries(data)) {
      copyValues(v, (expanse as any)[k]);
      if (options?.default) copyValues(v, (expanse.defaults as any)[k]);
    }
  }

  export function reorder(expanse: ExpanseBand, indices?: number[]) {
    const { labels, weights, cumulativeWeights, defaults } = expanse;

    if (!indices) {
      copyValues(defaults.labels, labels);
      copyValues(defaults.weights, weights);
      copyValues(defaults.cumulativeWeights, cumulativeWeights);

      expanse.sorted = false;
      Expanse.dispatch(expanse, `changed`);
      return;
    }

    const n = labels.length;
    const [tempLabels, tempWeights] = [Array(n), Array(n)];

    for (let i = 0; i < indices.length; i++) {
      tempLabels[indices[i]] = labels[i];
      tempWeights[indices[i]] = weights[i];
    }

    for (let i = 0; i < tempLabels.length; i++) {
      labels[i] = tempLabels[i];
      weights[i] = tempWeights[i];
    }

    copyValues(cumsum(weights), cumulativeWeights);

    expanse.sorted = true;
    Expanse.dispatch(expanse, `changed`);
  }

  export const breaks = ExpansePoint.breaks;
}
