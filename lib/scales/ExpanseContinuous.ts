import {
  applyDirection,
  diff,
  identity,
  minmax,
  prettyBreaks,
} from "../utils/funs";
import { Meta } from "../utils/Meta";
import { Poly } from "../utils/Poly";
import { Direction } from "../utils/types";
import { Expanse } from "./Expanse";

/**
 * Converts numeric values to the [0, 1] interval and back.
 */
export interface ExpanseContinuous extends Expanse<number> {
  type: `continuous`;
  value: number;

  min: number;
  max: number;
  scale: number;
  mult: number;
  offset: number;
  ratio: boolean;

  trans: (x: number) => number;
  inv: (x: number) => number;

  defaults: {
    min: number;
    max: number;
    scale: number;
    zero: number;
    one: number;
    direction: Direction;
    trans: (x: number) => number;
    inv: (x: number) => number;
  };
}

export namespace ExpanseContinuous {
  const type = `continuous` as const;

  type Options = {
    scale?: number;
    mult?: number;
    offset?: number;
    ratio?: boolean;
    zero?: number;
    one?: number;
    direction?: Direction;
  };

  export function of(min = 0, max = 1, options?: Options): ExpanseContinuous {
    const value = 0;

    const base = Expanse.base(options);
    const [trans, inv] = [identity, identity];
    const { scale = 1, mult = 1, offset = 0, ratio = false } = options ?? {};
    const vals = { min, max, mult, offset, scale, trans, inv };

    const defaults = { ...base.defaults, ...vals };
    const result = { type, value, ratio, ...base, ...vals, defaults };

    return result;
  }

  // Expanse method implementations
  Poly.set(Expanse.normalize, type, normalize);
  Poly.set(Expanse.unnormalize, type, unnormalize);
  Poly.set(Expanse.train, type, train);
  Poly.set(Expanse.breaks, type, breaks);

  function normalize(expanse: ExpanseContinuous, x: number) {
    const { min, max, zero, one } = expanse;
    const { direction, scale, mult, offset, trans } = expanse;

    let result = x / (scale * mult) - offset;
    result = (trans(result - offset) - trans(min)) / (trans(max) - trans(min));
    result = zero + result * (one - zero);
    result = applyDirection(result, direction);

    return result;
  }

  // Unnormalize doesn't use direction since [0, 1] already encodes direction
  function unnormalize(expanse: ExpanseContinuous, value: number) {
    const { min, max, zero, one } = expanse;
    const { scale, mult, offset, trans, inv } = expanse;
    const range = trans(max) - trans(min);

    let result = (value - zero) / (one - zero);
    result = inv(trans(min) + result * range);
    result = result * (scale * mult) + offset;

    return result;
  }

  function train(
    expanse: ExpanseContinuous,
    array: number[],
    options?: { default?: boolean; silent?: boolean },
  ) {
    let [min, max] = Meta.getN(array, [`min`, `max`]);
    if (!min || !max) [min, max] = minmax(array);

    min = expanse.ratio ? 0 : min;
    Expanse.set(expanse, (e) => ((e.min = min), (e.max = max)), options);
  }

  function breaks(expanse: ExpanseContinuous): number[] | string[] {
    const [min, max] = [0, 1].map((x) => unnormalize(expanse, x)).sort(diff);

    const labels = prettyBreaks(min, max, 4);
    return labels;
  }

  export function range(expanse: ExpanseContinuous) {
    const { min, max } = expanse;
    return max - min;
  }
}
