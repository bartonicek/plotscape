import { Reactive } from "../Reactive";
import { makeDispatchFn, makeListenFn } from "../utils/funs";
import { Direction } from "../utils/types";
import { ExpanseBand } from "./ExpanseBand";
import { ExpanseContinuous } from "./ExpanseContinuous";
import { ExpansePoint } from "./ExpansePoint";
import { ExpanseType } from "./ExpanseType";

export interface Expanse extends Reactive {
  type: ExpanseType;
  zero: number;
  one: number;
  direction: Direction;
  defaults: {
    zero: number;
    one: number;
    direction: Direction;
  };
}

export type ExpanseTypeMap = {
  [ExpanseType.Continuous]: ExpanseContinuous;
  [ExpanseType.Point]: ExpansePoint;
  [ExpanseType.Band]: ExpanseBand;
};

export type ExpanseValueMap = {
  [ExpanseType.Continuous]: number;
  [ExpanseType.Point]: string;
  [ExpanseType.Band]: string;
};

type EventType = `changed`;

type ExpanseMethods = {
  normalize(expanse: unknown, value: unknown): number;
  unnormalize(expanse: unknown, value: unknown): unknown;
  breaks(expanse: unknown): unknown[];
  train(
    expanse: unknown,
    array: unknown[],
    options?: { default?: boolean }
  ): void;
};

export namespace Expanse {
  export const methods: {
    [key in ExpanseType]: ExpanseMethods;
  } = {
    [ExpanseType.Continuous]: ExpanseContinuous,
    [ExpanseType.Point]: ExpansePoint,
    [ExpanseType.Band]: ExpanseBand,
  };

  export function continuous(min = 0, max = 1) {
    return ExpanseContinuous.of(min, max);
  }

  export function base() {
    const [zero, one] = [0, 1];
    const direction = Direction.Forwards;
    return Reactive.of({ zero, one, direction });
  }

  export function set<T extends Expanse>(
    expanse: T,
    setfn: (expanse: T & { [key in string]: any }) => void,
    options?: { default?: boolean; silent?: boolean }
  ) {
    setfn(expanse);
    if (options?.default) setfn(expanse.defaults as T);
    if (!options?.silent) Expanse.dispatch(expanse, `changed`);
  }

  export function restoreDefaults<T extends Expanse>(expanse: T) {
    const { defaults } = expanse;
    for (const [k, v] of Object.entries(defaults) as [keyof T, T[keyof T]][]) {
      if (Array.isArray(expanse[k]) && Array.isArray(v)) {
        for (let i = 0; i < v.length; i++) expanse[k][i] = v[i];
      } else expanse[k] = v;
    }
  }

  export const dispatch = makeDispatchFn<Expanse, EventType>();
  export const listen = makeListenFn<Expanse, EventType>();

  export function normalize<T extends Expanse>(
    expanse: T,
    value: ExpanseValueMap[T["type"]]
  ) {
    return methods[expanse.type].normalize(expanse, value);
  }

  export function unnormalize<T extends Expanse>(expanse: T, value: number) {
    return methods[expanse.type].unnormalize(
      expanse,
      value
    ) as ExpanseValueMap[T["type"]];
  }

  export function train<T extends Expanse>(
    expanse: T,
    array: ExpanseValueMap[T["type"]][],
    options?: { default?: boolean }
  ) {
    return methods[expanse.type].train(expanse, array as any, options);
  }

  export function breaks(expanse: Expanse) {
    return methods[expanse.type].breaks(expanse);
  }

  export function move(expanse: Expanse, amount: number) {
    const { direction } = expanse;
    Expanse.set(expanse, () => {
      expanse.zero += direction * amount;
      expanse.one += direction * amount;
    });
  }

  export function flip(expanse: Expanse) {
    Expanse.set(expanse, () => {
      expanse.direction *= -1;
    });
  }
}
