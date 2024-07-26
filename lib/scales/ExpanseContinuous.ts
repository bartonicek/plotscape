import { Direction } from "../utils/types";
import { diff, identity, minmax, prettyBreaks } from "../utils/funs";
import { applyDirection } from "../utils/funs";
import { Expanse } from "./Expanse";
import { ExpanseType } from "./ExpanseType";

export interface ExpanseContinuous extends Expanse<ExpanseType.Continuous> {
  min: number;
  max: number;
  trans: (x: number) => number;
  inv: (x: number) => number;
  defaults: {
    min: number;
    max: number;
    zero: number;
    one: number;
    direction: Direction;
    trans: (x: number) => number;
    inv: (x: number) => number;
  };
}

export namespace ExpanseContinuous {
  export function of(min: number, max: number): ExpanseContinuous {
    const type = ExpanseType.Continuous;
    const [zero, one] = [0, 1];
    const direction = Direction.Forwards;
    const [trans, inv] = [identity, identity];
    const defaults = { min, max, zero, one, direction, trans, inv };
    return { type, min, max, zero, one, direction, trans, inv, defaults };
  }

  export function normalize(expanse: ExpanseContinuous, value: number) {
    const { min, max, zero, one, direction, trans } = expanse;
    const range = trans(max) - trans(min);
    let pct = (trans(value) - trans(min)) / range;
    pct = zero + pct * (one - zero);

    return applyDirection(pct, direction);
  }

  // Unnormalize doesn't use direction since [0, 1] already encodes direction
  export function unnormalize(expanse: ExpanseContinuous, value: number) {
    const { min, max, zero, one, direction, trans, inv } = expanse;
    value = applyDirection(value, direction);
    const pct = (value - zero) / (one - zero);
    const range = trans(max) - trans(min);

    return inv(trans(min) + pct * range);
  }

  export function train(expanse: ExpanseContinuous, array: number[]) {
    const [min, max] = minmax(array);
    expanse.min = min;
    expanse.max = max;
  }

  export function breaks(expanse: ExpanseContinuous, n = 4) {
    const [min, max] = [0, 1]
      .map((x) => ExpanseContinuous.normalize(expanse, x))
      .sort(diff);
    const labels = prettyBreaks(min, max, n);
    return labels;
  }
}
