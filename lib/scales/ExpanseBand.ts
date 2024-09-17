import {
  applyDirection,
  compareAlphaNumeric,
  copyValues,
  cumsum,
  isArray,
  last,
  ordered,
  seqLength,
} from "../utils/funs";
import { Poly } from "../utils/Poly";
import { Reactive } from "../utils/Reactive";
import { Direction } from "../utils/types";
import { Expanse } from "./Expanse";

/**
 * Converts string labels to the [0, 1] interval and back, such that each
 * label is placed in the middle of its corresponding bin.
 */
export interface ExpanseBand extends Expanse<string> {
  type: `band`;

  ordered: boolean;
  labels: string[];
  order: number[];
  weights: number[];
  cumulativeWeights: number[];

  defaults: {
    ordered: boolean;
    labels: string[];
    order: number[];
    weights: number[];
    cumulativeWeights: number[];
    zero: number;
    one: number;
    direction: Direction;
  };
}

export namespace ExpanseBand {
  const type = `band`;

  type Options = {
    weights?: number[];
    zero?: number;
    one?: number;
    direction?: Direction;
  };

  export function of(labels: string[] = [], options?: Options): ExpanseBand {
    const value = ``;
    const base = Expanse.base(options);

    const [ordered, order] = [false, seqLength(0, labels.length)];
    const weights = options?.weights ?? Array(labels.length).fill(1);
    const cumulativeWeights = cumsum(weights);

    const vals = { labels, ordered, order, weights, cumulativeWeights };

    const defaults = {
      ordered,
      labels: [...labels],
      order: [...order],
      weights: [...weights],
      cumulativeWeights: [...cumulativeWeights],
      ...base.defaults,
    };

    return { value, type, ...vals, ...base, defaults };
  }

  // Expanse methods implementations
  Poly.set(Expanse.normalize, type, normalize);
  Poly.set(Expanse.unnormalize, type, unnormalize);
  Poly.set(Expanse.train, type, train);
  Poly.set(Expanse.breaks, type, breaks);
  Poly.set(Expanse.reorder, type, reorder);

  function getMidpoint(expanse: ExpanseBand, index: number) {
    const { order, cumulativeWeights } = expanse;
    index = order[index];

    const lower = cumulativeWeights[index - 1] ?? 0;
    const upper = cumulativeWeights[index];
    const max = last(cumulativeWeights);

    return (lower + upper) / 2 / max;
  }

  export function setWeights(expanse: ExpanseBand, weights?: number[]) {
    weights = weights ?? Array(expanse.labels.length).fill(1);

    if (weights.length != expanse.labels.length) {
      const msg = `The length of the weights must match the length of labels`;
      throw new Error(msg);
    }

    const { order } = expanse;
    const cumulativeWeights = cumsum(ordered(weights, order));

    copyValues(weights, expanse.weights);
    copyValues(weights, expanse.defaults.weights);
    copyValues(cumulativeWeights, expanse.cumulativeWeights);
    copyValues(cumulativeWeights, expanse.defaults.cumulativeWeights);

    Reactive.dispatch(expanse, `changed`);
  }

  export function normalize(expanse: ExpanseBand, value: string) {
    const { labels, zero, one, direction } = expanse;

    const index = labels.indexOf(value);
    if (index === -1) throw new Error(`Label ${value} not found in: ${labels}`);

    const midpoint = getMidpoint(expanse, index);
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
    expanse: ExpanseBand,
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

    const weights = Array(labels.length).fill(1);
    const cumulativeWeights = cumsum(ordered(weights, order));

    const data = { labels, weights, cumulativeWeights };

    for (const [k, v] of Object.entries(data) as [keyof ExpanseBand, any][]) {
      if (isArray(expanse[k])) copyValues(v, expanse[k]);
      if (options?.default) copyValues(v, (expanse.defaults as any)[k]);
    }
    Expanse.set(expanse, () => {}, options); // Trigger listeners
  }

  export function reorder(expanse: ExpanseBand, indices?: number[]) {
    const { order, weights, cumulativeWeights, defaults } = expanse;

    if (!indices) {
      copyValues(defaults.order, order);
      copyValues(cumsum(ordered(weights, order)), cumulativeWeights);

      expanse.ordered = false;
      Reactive.dispatch(expanse, `changed`);
      return;
    }

    copyValues(indices, order);
    copyValues(cumsum(ordered(weights, indices)), cumulativeWeights);

    expanse.ordered = true;
    Reactive.dispatch(expanse, `changed`);
  }

  export function breaks(expanse: ExpanseBand) {
    return ordered(expanse.labels, expanse.order);
  }

  export function isContinuous() {
    return false;
  }

  export function isDiscrete() {
    return true;
  }
}
