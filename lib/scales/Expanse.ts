import { Reactive } from "../Reactive";
import {
  copyProps,
  copyValues,
  invertRange,
  isArray,
  makeDispatchFn,
  makeListenFn,
} from "../utils/funs";
import { Direction, Entries } from "../utils/types";
import { ExpanseBand } from "./ExpanseBand";
import { ExpanseContinuous } from "./ExpanseContinuous";
import { ExpansePoint } from "./ExpansePoint";
import { ExpanseType } from "./ExpanseType";

/** Converts values from some type to the interval [0, 1] and back. */
export interface Expanse extends Reactive {
  type: ExpanseType;
  zero: number;
  one: number;
  direction: Direction;
  frozen: string[];
  linked: Expanse[];
  defaults: {
    zero: number;
    one: number;
    direction: Direction;
    [key: string]: any;
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

  export const Continuous = ExpanseType.Continuous;
  export const Point = ExpanseType.Point;
  export const Band = ExpanseType.Band;
  export const continuous = ExpanseContinuous.of;
  export const point = ExpansePoint.of;
  export const band = ExpanseBand.of;

  export function base(options?: {
    zero?: number;
    one?: number;
    direction?: Direction;
  }) {
    const zero = options?.zero ?? 0;
    const one = options?.one ?? 1;
    const direction = options?.direction ?? Direction.Forwards;
    const frozen = [] as string[];
    const linked = [] as Expanse[];
    return Reactive.of({ zero, one, direction, frozen, linked });
  }

  export function set<T extends Expanse>(
    expanse: T,
    setfn: (expanse: T & { [key in string]: any }) => void,
    options?: { default?: boolean; silent?: boolean }
  ) {
    const temp = { ...expanse };
    setfn(temp);
    for (const k of expanse.frozen) delete temp[k as keyof typeof temp];

    copyProps(temp, expanse);
    if (options?.default) copyProps(temp, expanse.defaults);
    if (!options?.silent) Expanse.dispatch(expanse, `changed`);
  }

  export function freeze<T extends Expanse>(
    expanse: T,
    properties: (keyof T)[]
  ) {
    for (const prop of properties as string[]) {
      if (!expanse.frozen.includes(prop)) expanse.frozen.push(prop);
    }
  }

  export function linkTo<T extends Expanse>(expanse: T, other: T) {
    expanse.linked.push(other);
  }

  export function restoreDefaults<T extends Expanse>(expanse: T) {
    const { defaults } = expanse;

    for (const [k, v] of Object.entries(defaults) as Entries<T>) {
      if (isArray(v) && isArray(expanse[k])) copyValues(v, expanse[k]);
      else expanse[k] = v;
    }

    Expanse.dispatch(expanse, `changed`);
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
    type ReturnType = ExpanseValueMap[T["type"]];
    return methods[expanse.type].unnormalize(expanse, value) as ReturnType;
  }

  export function train<T extends Expanse>(
    expanse: T,
    array: ExpanseValueMap[T["type"]][],
    options?: { default?: boolean; ratio?: true }
  ) {
    return methods[expanse.type].train(expanse, array as any, options);
  }

  export function breaks(expanse: Expanse) {
    return methods[expanse.type].breaks(expanse);
  }

  export function move(expanse: Expanse, amount: number) {
    const { direction: d } = expanse;
    const amt = amount;
    Expanse.set(expanse, (e) => ((e.zero += d * amt), (e.one += d * amt)));
    for (const e of expanse.linked) Expanse.move(e, amount);
  }

  export function expand(
    expanse: Expanse,
    zero: number,
    one: number,
    options?: { default?: boolean }
  ) {
    const { zero: currZero, one: currOne, direction } = expanse;
    const currRange = currOne - currZero;

    // Reflect if direction is backwards
    if (direction === Direction.Backwards) [zero, one] = [1 - zero, 1 - one];

    // Normalize the zoom values within the current range
    let [nZero, nOne] = [zero, one].map((x) => (x - currZero) / currRange);
    [nZero, nOne] = invertRange(nZero, nOne);

    // Finally, reflect again
    if (direction === Direction.Backwards) {
      [nZero, nOne] = [1 - nZero, 1 - nOne];
    }

    Expanse.set(expanse, (e) => ((e.zero = nZero), (e.one = nOne)), options);
  }

  export function flip(expanse: Expanse) {
    Expanse.set(expanse, () => (expanse.direction *= -1));
  }

  export function isContinuous(expanse: Expanse) {
    return expanse.type === ExpanseType.Continuous;
  }

  export function isPoint(expanse: Expanse) {
    return expanse.type === ExpanseType.Point;
  }
}
