import {
  applyDirection,
  diff,
  identity,
  minmax,
  prettyBreaks,
} from "../utils/funs";
import { Direction } from "../utils/types";
import { Expanse } from "./Expanse";
import { ExpanseType } from "./ExpanseType";

export interface ExpanseContinuous extends Expanse {
  type: ExpanseType.Continuous;
  min: number;
  max: number;
  scale: number;
  mult: number;
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
  export function of(
    min = 0,
    max = 1,
    options?: {
      scale?: number;
      mult?: number;
      offset?: number;
      ratio?: boolean;
      zero?: number;
      one?: number;
      direction?: Direction;
    }
  ): ExpanseContinuous {
    const type = ExpanseType.Continuous;
    const base = Expanse.base(options);
    const { zero, one, direction } = base;
    const [trans, inv] = [identity, identity];
    const ratio = options?.ratio ?? false;
    const scale = options?.scale ?? 1;
    const mult = options?.mult ?? 1;
    const offset = options?.offset ?? 0;

    const defaults = {
      min,
      max,
      scale,
      mult,
      zero,
      one,
      offset,
      direction,
      trans,
      inv,
    };

    return {
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

    const range = trans(max) - trans(min);
    let pct = (trans(value - offset) - trans(min)) / range / scale / mult;
    pct = zero + pct * (one - zero);

    return applyDirection(pct, direction);
  }

  // Unnormalize doesn't use direction since [0, 1] already encodes direction
  export function unnormalize(expanse: ExpanseContinuous, value: number) {
    const { min, max, zero, one } = expanse;
    const { scale, mult, offset, trans, inv } = expanse;

    const pct = ((value - zero) / (one - zero)) * scale * mult;
    const range = trans(max) - trans(min);

    return inv(trans(min) + pct * range) + offset;
  }

  export function train(
    expanse: ExpanseContinuous,
    array: number[],
    options?: { default?: boolean; silent?: boolean; ratio?: true }
  ) {
    let [min, max] = minmax(array);
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
