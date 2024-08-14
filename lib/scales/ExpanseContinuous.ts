import {
  applyDirection,
  diff,
  identity,
  minmax,
  prettyBreaks,
} from "../utils/funs";
import { Meta } from "../utils/Meta";
import { Direction } from "../utils/types";
import { Expanse } from "./Expanse";

/**
 * Converts numeric values to the [0, 1] interval and back.
 */
export interface ExpanseContinuous extends Expanse<number> {
  type: `continuous`;

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
  type Options = {
    scale?: number;
    mult?: number;
    offset?: number;
    ratio?: boolean;
    negative?: boolean;
    zero?: number;
    one?: number;
    direction?: Direction;
  };

  export function of(min = 0, max = 1, options?: Options): ExpanseContinuous {
    const value = 0;
    const type = `continuous`;

    const base = Expanse.base(options);
    const [trans, inv] = [identity, identity];
    const scale = options?.scale ?? 1;
    const mult = options?.mult ?? 1;
    const offset = options?.offset ?? 0;
    const ratio = options?.ratio ?? false;

    const defaults = { min, max, scale, mult, ...base, offset, trans, inv };

    return {
      value,
      type,
      min,
      max,
      scale,
      mult,
      offset,
      ratio,
      ...base,
      trans,
      inv,
      defaults,
    };
  }

  export function normalize(expanse: ExpanseContinuous, value: number) {
    const { min, max, zero, one } = expanse;
    const { direction, scale, mult, offset, trans } = expanse;

    value = value / (scale * mult) - offset;
    const range = trans(max) - trans(min);
    let pct = (trans(value - offset) - trans(min)) / range;
    pct = zero + pct * (one - zero);

    return applyDirection(pct, direction);
  }

  // Unnormalize doesn't use direction since [0, 1] already encodes direction
  export function unnormalize(expanse: ExpanseContinuous, value: number) {
    const { min, max, zero, one } = expanse;
    const { scale, mult, offset, trans, inv } = expanse;

    const pct = (value - zero) / (one - zero);
    const range = trans(max) - trans(min);

    return inv(trans(min) + pct * range) * (scale * mult) + offset;
  }

  export function range(expanse: ExpanseContinuous) {
    const { min, max } = expanse;
    return max - min;
  }

  export function train(
    expanse: ExpanseContinuous,
    array: number[],
    options?: { default?: boolean; silent?: boolean; ratio?: true },
  ) {
    let [min, max] = Meta.getMinMax(array) ?? minmax(array);
    min = expanse.ratio || options?.ratio ? 0 : min;
    Expanse.set(expanse, (e) => ((e.min = min), (e.max = max)), options);
  }

  export function breaks(expanse: ExpanseContinuous, n = 4) {
    const [min, max] = [0, 1]
      .map((x) => ExpanseContinuous.unnormalize(expanse, x))
      .sort(diff);

    const labels = prettyBreaks(min, max, n);
    return labels;
  }
}
