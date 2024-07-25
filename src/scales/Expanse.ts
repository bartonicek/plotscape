import { ExpanseContinuous } from "./ExpanseContinuous";
import { ExpanseBand } from "./ExpanseBand";
import { ExpansePoint } from "./ExpansePoint";
import { Direction } from "../types";
import { ExpanseTag } from "./ExpanseTag";

export interface Expanse<T = ExpanseTag> {
  type: T;
  zero: number;
  one: number;
  direction: Direction;
  defaults: {
    zero: number;
    one: number;
    direction: Direction;
  };
}

export type ExpanseValue = {
  [ExpanseTag.Continuous]: number;
  [ExpanseTag.Point]: string;
  [ExpanseTag.Band]: string;
};

export type ExpanseType = {
  [ExpanseTag.Continuous]: ExpanseContinuous;
  [ExpanseTag.Point]: ExpansePoint;
  [ExpanseTag.Band]: ExpanseBand;
};

export module Expanse {
  export const namespaces: {
    [key in ExpanseTag]: {
      normalize(expanse: any, value: any): number;
      unnormalize(expanse: any, value: any): ExpanseValue[key];
    };
  } = {
    [ExpanseTag.Continuous]: ExpanseContinuous,
    [ExpanseTag.Point]: ExpansePoint,
    [ExpanseTag.Band]: ExpanseBand,
  };
  export function move(expanse: Expanse, amount: number) {
    const { zero, one, direction } = expanse;
    expanse.zero = zero + direction * amount;
    expanse.one = one + direction * amount;
  }
  export function flip(expanse: Expanse) {
    expanse.direction *= -1;
  }
  export function set<T extends Expanse>(
    expanse: T,
    setfn: (expanse: T) => Partial<T>
  ) {
    const diffs = setfn(expanse);
    for (const [k, v] of Object.entries(diffs) as [keyof T, T[keyof T]][]) {
      expanse[k] = v;
    }
  }
  export function restoreDefaults<T extends Expanse>(expanse: T) {
    const { defaults } = expanse;
    for (const [k, v] of Object.entries(defaults) as [keyof T, T[keyof T]][]) {
      if (Array.isArray(expanse[k]) && Array.isArray(v)) {
        for (let i = 0; i < v.length; i++) expanse[k][i] = v[i];
      } else expanse[k] = v;
    }
  }
  export function normalize<T extends ExpanseTag>(
    expanse: Expanse<T>,
    value: ExpanseValue[T]
  ) {
    return namespaces[expanse.type].normalize(expanse, value);
  }
  export function unnormalize<T extends ExpanseTag>(
    expanse: Expanse<T>,
    value: number
  ): ExpanseValue[T] {
    return namespaces[expanse.type].unnormalize(expanse, value);
  }
}
