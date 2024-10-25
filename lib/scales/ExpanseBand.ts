import {
  compareAlphaNumeric,
  copyValues,
  cumsum,
  last,
  ordered,
  seqLength,
} from "../utils/funs";
import { Polymorphic } from "../utils/Polymorphic";
import { Reactive } from "../utils/Reactive";
import { satisfies } from "../utils/types";
import { Expanse, ExpanseMethods } from "./Expanse";

/**
 * Converts string labels to the [0, 1] interval and back, such that each
 * label is placed in the middle of its corresponding bin.
 */
export interface ExpanseBand extends Expanse<string> {
  type: `band`;
  value: string;
  normalized: number;

  props: ExpanseBand.Props;
  defaults: ExpanseBand.Props;
}

// Check that polymorphic methods are implemented
satisfies<ExpanseMethods<string>, typeof ExpanseBand>;

export namespace ExpanseBand {
  const type = `band` as const;

  export interface Props {
    ordered: boolean;
    labels: string[];
    order: number[];
    weights: number[];
    cumulativeWeights: number[];
  }

  export function of(labels: string[] = []): ExpanseBand {
    const base = Expanse.base();

    const [ordered, order] = [false, seqLength(0, labels.length)];
    const weights = Array(labels.length).fill(1);
    const cumulativeWeights = cumsum(weights);

    const props = { labels, ordered, order, weights, cumulativeWeights };
    const defaults = structuredClone(props);
    const frozen = [] as (keyof Props)[];

    return { ...base, type, props, defaults, frozen } as ExpanseBand;
  }

  // Expanse methods implementations
  Polymorphic.set(Expanse.normalize, type, normalize);
  Polymorphic.set(Expanse.unnormalize, type, unnormalize);
  Polymorphic.set(Expanse.train, type, train);
  Polymorphic.set(Expanse.breaks, type, breaks);
  Polymorphic.set(Expanse.reorder, type, reorder);

  export function normalize(expanse: ExpanseBand, value: string) {
    const { labels } = expanse.props;
    const index = labels.indexOf(value);
    return getMidpoint(expanse, index);
  }

  function getMidpoint(expanse: ExpanseBand, index: number) {
    const { order, cumulativeWeights } = expanse.props;
    index = order[index];

    const lower = cumulativeWeights[index - 1] ?? 0;
    const upper = cumulativeWeights[index];
    const max = last(cumulativeWeights);

    return (lower + upper) / 2 / max;
  }

  export function unnormalize(expanse: ExpanseBand, value: number) {
    const { labels, cumulativeWeights } = expanse.props;

    const weight = value * last(cumulativeWeights);
    let index = 0;

    while (index < cumulativeWeights.length - 1) {
      if (cumulativeWeights[index] >= weight) break;
      index++;
    }

    return labels[index];
  }

  export function train(
    expanse: ExpanseBand,
    array: string[],
    options?: { default?: boolean; silent?: boolean },
  ) {
    const { props } = expanse;
    const { order } = props;
    const labels = Array.from(new Set(array)).sort(compareAlphaNumeric);

    if (!order.length) {
      for (let i = 0; i < labels.length; i++) order[i] = i;
      expanse.defaults.order = [...order];
      props.ordered = false;
    }

    const weights = Array(labels.length).fill(1);
    const cumulativeWeights = cumsum(ordered(weights, order));

    const data = { labels, weights, cumulativeWeights };

    for (const [k, v] of Object.entries(data) as [keyof Props, any][]) {
      copyValues(v, expanse.props[k]);
      if (options?.default) copyValues(v, (expanse.defaults as any)[k]);
    }

    Expanse.set(expanse, () => ({}), options); // Trigger listeners
  }

  export function reorder(expanse: ExpanseBand, indices?: number[]) {
    const { props, defaults } = expanse;
    const { order, weights, cumulativeWeights } = expanse.props;

    if (!indices) {
      copyValues(defaults.order, order);
      copyValues(cumsum(ordered(weights, order)), cumulativeWeights);

      props.ordered = false;
      Reactive.dispatch(expanse, `changed`);
      return;
    }

    copyValues(indices, order);
    copyValues(cumsum(ordered(weights, indices)), cumulativeWeights);

    props.ordered = true;
    Reactive.dispatch(expanse, `changed`);
  }

  export function breaks(expanse: ExpanseBand) {
    const { labels, order } = expanse.props;
    return ordered(labels, order);
  }

  export function setWeights(expanse: ExpanseBand, weights?: number[]) {
    const { props, defaults } = expanse;
    weights = weights ?? Array(props.labels.length).fill(1);

    if (weights.length != props.labels.length) {
      const msg = `The length of the weights must match the length of labels`;
      throw new Error(msg);
    }

    const { order } = props;
    const cumulativeWeights = cumsum(ordered(weights, order));

    copyValues(weights, props.weights);
    copyValues(weights, defaults.weights);
    copyValues(cumulativeWeights, props.cumulativeWeights);
    copyValues(cumulativeWeights, defaults.cumulativeWeights);

    Reactive.dispatch(expanse, `changed`);
  }
}
