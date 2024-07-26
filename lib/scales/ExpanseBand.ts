import { Direction } from "../utils/types";
import { Expanse } from "./Expanse";
import { applyDirection } from "../utils/funs";
import { ExpansePoint } from "./ExpansePoint";
import { ExpanseType } from "./ExpanseType";

export interface ExpanseBand extends Expanse<ExpanseType.Band> {
  labels: string[];
}

export namespace ExpanseBand {
  export function of(labels: string[]): ExpanseBand {
    const type = ExpanseType.Band;
    const [zero, one] = [0, 1];
    const direction = Direction.Forwards;
    const defaults = { labels: [...labels], zero, one, direction };
    return { type, labels, zero, one, direction, defaults };
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

  // Have to coerce because of the type tag property
  export function reorder(expanse: ExpanseBand, indices: number[]) {
    ExpansePoint.reorder(expanse as unknown as ExpansePoint, indices);
  }

  export function breaks(expanse: ExpanseBand) {
    return ExpansePoint.breaks(expanse as unknown as ExpansePoint);
  }
}
