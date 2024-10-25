import {
  compareAlphaNumeric,
  copyValues,
  ordered,
  seqLength,
} from "../utils/funs";
import { Polymorphic } from "../utils/Polymorphic";
import { Reactive } from "../utils/Reactive";
import { satisfies } from "../utils/types";
import { Expanse, ExpanseMethods } from "./Expanse";
import { ExpanseBand } from "./ExpanseBand";

/** Converts string labels to the [0, 1] interval and back, such that each value is placed
 * equidistantly along the interval, and the first label is placed at 0 and the last at 1.
 */
export interface ExpansePoint extends Expanse<string> {
  type: `point`;
  value: string;
  normalized: number;

  props: ExpansePoint.Props;
  defaults: ExpansePoint.Props;
  frozen: (keyof ExpansePoint.Props)[];
}

// Check that generic methods are implemented
satisfies<ExpanseMethods<string>, typeof ExpanseBand>;

export namespace ExpansePoint {
  const type = `point`;

  export interface Props {
    ordered: boolean;
    labels: string[];
    order: number[];
  }

  export function of(labels: string[] = []): ExpansePoint {
    const base = Expanse.base();
    const [ordered, order] = [false, seqLength(0, labels.length)];
    const props = { labels, ordered, order };
    const defaults = structuredClone(props);
    const frozen = [] as (keyof Props)[];

    return { ...base, type, props, defaults, frozen } as ExpansePoint;
  }

  // Expanse methods implementations
  Polymorphic.set(Expanse.normalize, type, normalize);
  Polymorphic.set(Expanse.unnormalize, type, unnormalize);
  Polymorphic.set(Expanse.train, type, train);
  Polymorphic.set(Expanse.breaks, type, breaks);
  Polymorphic.set(Expanse.reorder, type, reorder);

  export function normalize(
    expanse: ExpansePoint,
    value: string,
  ): number | number[] {
    const { labels, order } = expanse.props;
    const index = order[labels.indexOf(value)];
    if (index === -1) return index;
    return index / (labels.length - 1);
  }

  export function unnormalize(expanse: ExpansePoint, index: number) {
    const { labels, order } = expanse.props;
    index = Math.round(index * (labels.length - 1));
    return labels[order[index]];
  }

  export function train(
    expanse: ExpansePoint,
    array: string[],
    options?: { default?: boolean; silent?: boolean },
  ) {
    const { props, defaults } = expanse;
    const { order } = props;
    const labels = Array.from(new Set(array)).sort(compareAlphaNumeric);

    if (!order.length) {
      for (let i = 0; i < labels.length; i++) order[i] = i;
      defaults.order = [...order];
      props.ordered = false;
    }

    copyValues(labels, props.labels);
    if (options?.default) copyValues(labels, expanse.defaults.labels);
    Expanse.set(expanse, () => ({}), options); // Trigger listeners
  }

  export function reorder(expanse: ExpansePoint, indices?: number[]) {
    const { props, defaults } = expanse;
    const { order } = props;

    if (!indices) {
      copyValues(defaults.order, order);
      props.ordered = false;
      Reactive.dispatch(expanse, `changed`);
      return;
    }

    copyValues(indices, order);
    props.ordered = true;
    Reactive.dispatch(expanse, `changed`);
  }

  export function breaks(expanse: ExpansePoint) {
    const { labels, order } = expanse.props;
    return ordered(labels, order);
  }
}
