import { ExpanseContinuous } from "./ExpanseContinuous";
import { ExpanseBand } from "./ExpanseBand";
import { ExpansePoint } from "./ExpansePoint";
import { Direction } from "../utils/types";
import { ExpanseType } from "./ExpanseType";
import { makeDispatchFn, makeListenFn } from "../utils/funs";

export interface Expanse<T = ExpanseType> {
  type: T;
  dispatch: EventTarget;
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

export namespace Expanse {
  export const namespaces: {
    [key in ExpanseType]: {
      normalize(expanse: any, value: any): number;
      unnormalize(expanse: any, value: any): ExpanseValueMap[key];
      breaks(expanse: any): ExpanseValueMap[key][];
    };
  } = {
    [ExpanseType.Continuous]: ExpanseContinuous,
    [ExpanseType.Point]: ExpansePoint,
    [ExpanseType.Band]: ExpanseBand,
  };

  export function continuous(min = 0, max = 1) {
    return ExpanseContinuous.of(min, max);
  }

  export function base() {
    const dispatch = new EventTarget();
    const [zero, one] = [0, 1];
    const direction = Direction.Forwards;
    return { dispatch, zero, one, direction };
  }

  export function set<T extends Expanse>(
    expanse: T,
    setfn: (expanse: any) => void
  ) {
    setfn(expanse);
    Expanse.dispatch(expanse, `changed`);
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

  export function normalize<T extends ExpanseType>(
    expanse: Expanse<T>,
    value: ExpanseValueMap[T]
  ) {
    return namespaces[expanse.type].normalize(expanse, value);
  }

  export function unnormalize<T extends ExpanseType>(
    expanse: Expanse<T>,
    value: number
  ): ExpanseValueMap[T] {
    return namespaces[expanse.type].unnormalize(expanse, value);
  }

  export function breaks(expanse: Expanse) {
    return namespaces[expanse.type].breaks(expanse);
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
