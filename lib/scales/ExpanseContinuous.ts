import { diff, identity, minmax, prettyBreaks } from "../utils/funs";
import { Meta } from "../utils/Meta";
import { Poly } from "../utils/Poly";
import { Expanse } from "./Expanse";

/**
 * Converts numeric values to the [0, 1] interval and back.
 */
export interface ExpanseContinuous extends Expanse<number> {
  type: `continuous`;
  value: number;

  props: ExpanseContinuous.Props;
  defaults: ExpanseContinuous.Props;
  frozen: (keyof ExpanseContinuous.Props)[];
}

export namespace ExpanseContinuous {
  const type = `continuous` as const;

  export interface Props {
    min: number;
    max: number;
    scale: number;
    mult: number;
    offset: number;
    ratio: boolean;
    trans: (x: number) => number;
    inv: (x: number) => number;
  }

  export function of(min = 0, max = 1): ExpanseContinuous {
    const value = 0;

    const base = Expanse.base();
    const [trans, inv] = [identity, identity];
    const [scale, mult, offset, ratio] = [1, 1, 0, false];
    const props = { min, max, scale, mult, offset, ratio, trans, inv };
    const defaults = { ...props, trans, inv };
    const frozen = [] as (keyof Props)[];

    return { ...base, value, type, props, defaults, frozen };
  }

  // Expanse methods implementations
  Poly.set(Expanse.normalize, type, normalize);
  Poly.set(Expanse.unnormalize, type, unnormalize);
  Poly.set(Expanse.train, type, train);
  Poly.set(Expanse.breaks, type, breaks);

  export function normalize(
    expanse: ExpanseContinuous,
    value: number,
  ): number | number[] {
    const { min, max, scale, mult, offset, trans } = expanse.props;
    const range = trans(max) - trans(min);

    let result = value / (scale * mult) - offset;
    result = (trans(result - offset) - trans(min)) / range;

    return result;
  }

  export function unnormalize(expanse: ExpanseContinuous, value: number) {
    const { min, max, scale, mult, offset, trans, inv } = expanse.props;
    const range = trans(max) - trans(min);

    let result = inv(trans(min) + value * range);
    result = result * (scale * mult) + offset;

    return result;
  }

  export function train(
    expanse: ExpanseContinuous,
    array: number[],
    options?: { default?: boolean; silent?: boolean; ratio?: true },
  ) {
    const { ratio } = expanse.props;
    let [min, max] = Meta.get(array, [`min`, `max`]);
    if (!min || !max) [min, max] = minmax(array);

    min = ratio || options?.ratio ? 0 : min;
    Expanse.set(expanse, () => ({ min, max }), options);
  }

  export function breaks(
    expanse: ExpanseContinuous,
    zero: number = 0,
    one: number = 1,
  ) {
    let [min, max] = [zero, one].map((x) => unnormalize(expanse, x));
    [min, max] = [min, max].sort(diff);
    const labels = prettyBreaks(min, max, 4);
    return labels;
  }

  export function range(expanse: ExpanseContinuous) {
    const { min, max } = expanse.props;
    return max - min;
  }
}
