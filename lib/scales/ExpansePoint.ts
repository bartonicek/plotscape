import { Expanse } from "./Expanse";
import { applyDirection, compareAlphaNumeric } from "../utils/funs";
import { ExpanseType } from "./ExpanseType";

export interface ExpansePoint extends Expanse {
  type: ExpanseType.Point;
  labels: string[];
}

export namespace ExpansePoint {
  export function of(labels: string[]): ExpansePoint {
    const type = ExpanseType.Point;
    const base = Expanse.base();
    const { zero, one, direction } = base;
    const defaults = { labels: [...labels], zero, one, direction };
    return { type, labels, ...base, defaults };
  }

  export function normalize(expanse: ExpansePoint, value: string) {
    const { labels, zero, one, direction } = expanse;
    const index = labels.indexOf(value);
    if (index === -1) return index;

    const pct = zero + (index / (labels.length - 1)) * (one - zero);
    return applyDirection(pct, direction);
  }

  export function unnormalize(expanse: ExpansePoint, value: number) {
    const { labels, zero, one, direction } = expanse;
    value = applyDirection(value, direction);
    const pct = (value - zero) / (one - zero);
    const index = Math.round(pct * (labels.length - 1));
    return labels[index];
  }

  export function train(expanse: Omit<ExpansePoint, `type`>, array: string[]) {
    const labels = Array.from(new Set(array)).sort(compareAlphaNumeric);
    expanse.labels.length = 0;
    for (let i = 0; i < labels.length; i++) expanse.labels[i] = labels[i];
  }

  export function reorder(
    expanse: Omit<ExpansePoint, `type`>,
    indices: number[]
  ) {
    const { labels } = expanse;
    const temp = Array(labels.length);
    for (let i = 0; i < indices.length; i++) temp[i] = labels[indices[i]];
    for (let i = 0; i < temp.length; i++) expanse.labels[i] = temp[i];
  }

  export function breaks(expanse: Omit<ExpansePoint, `type`>) {
    return expanse.labels;
  }
}