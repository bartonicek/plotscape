import {
  copyProps,
  copyValues,
  invertRange,
  isArray,
  isNumberArray,
} from "../utils/funs";
import { Reactive } from "../utils/Reactive";
import { Direction, Entries } from "../utils/types";
import { ExpanseBand } from "./ExpanseBand";
import { ExpanseCompound } from "./ExpanseCompound";
import { ExpanseContinuous } from "./ExpanseContinuous";
import { ExpansePoint } from "./ExpansePoint";
import { ExpanseSplit } from "./ExpanseSplit";

/** Converts values from some type to the interval [0, 1] and back. */
export interface Expanse<T = any> extends Reactive {
  readonly value: T; // Only a type-level tag
  type: Expanse.Type;

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
  [Expanse.Type.Continuous]: ExpanseContinuous;
  [Expanse.Type.Point]: ExpansePoint;
  [Expanse.Type.Band]: ExpanseBand;
};

type EventType = `changed`;

type ExpanseMethods = {
  normalize(expanse: unknown, value: unknown): unknown;
  unnormalize(expanse: unknown, value: unknown): unknown;
  breaks(expanse: unknown): string[] | number[];
  train(expanse: unknown, array: unknown[], options?: {}): void;
};

export namespace Expanse {
  export enum Type {
    Continuous = `continuous`,
    Point = `point`,
    Band = `band`,
    Compound = `compound`,
    Split = `split`,
  }

  export const methods: {
    [key in Type]: ExpanseMethods;
  } = {
    [Expanse.Type.Continuous]: ExpanseContinuous,
    [Expanse.Type.Point]: ExpansePoint,
    [Expanse.Type.Band]: ExpanseBand,
    [Expanse.Type.Compound]: ExpanseCompound,
    [Expanse.Type.Split]: ExpanseSplit,
  };

  export const Continuous = Type.Continuous;
  export const Point = Type.Point;
  export const Band = Type.Band;

  export const continuous = ExpanseContinuous.of;
  export const point = ExpansePoint.of;
  export const band = ExpanseBand.of;
  export const compound = ExpanseCompound.of;
  export const split = ExpanseSplit.of;

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
    options?: { default?: boolean; silent?: boolean },
  ) {
    const temp = { ...expanse };
    setfn(temp);

    for (const k of expanse.frozen) delete temp[k as keyof typeof temp];
    for (const k of Object.keys(temp) as (keyof typeof temp)[]) {
      if (temp[k] === expanse[k]) delete temp[k];
    }

    copyProps(temp, expanse);

    if (!!options?.default) copyProps(temp, expanse.defaults);
    if (!options?.silent) Expanse.dispatch(expanse, `changed`);
  }

  export function infer(values: any[], options = { train: true }) {
    const expanse = isNumberArray(values)
      ? Expanse.continuous()
      : Expanse.point();
    if (options.train) Expanse.train(expanse, values);
    return expanse;
  }

  export function freeze<T extends Expanse>(expanse: T, props: (keyof T)[]) {
    for (const prop of props as string[]) {
      if (!expanse.frozen.includes(prop)) expanse.frozen.push(prop);
    }
  }

  export function linkTo<T extends Expanse>(expanse: T, other: T) {
    if (!expanse.linked.includes(other)) expanse.linked.push(other);
  }

  export function restoreDefaults<T extends Expanse>(expanse: T) {
    const { defaults } = expanse;

    for (const [k, v] of Object.entries(defaults) as Entries<T>) {
      if (isArray(v) && isArray(expanse[k])) copyValues(v, expanse[k]);
      else expanse[k] = v;
    }

    Expanse.dispatch(expanse, `changed`);
  }

  export const dispatch = Reactive.makeDispatchFn<Expanse, EventType>();
  export const listen = Reactive.makeListenFn<Expanse, EventType>();

  export function normalize<T extends Expanse>(expanse: T, value: T[`value`]) {
    return methods[expanse.type].normalize(expanse, value) as number;
  }

  export function unnormalize<T extends Expanse>(expanse: T, value: number) {
    return methods[expanse.type].unnormalize(expanse, value) as T[`value`];
  }

  export function train<T extends Expanse>(
    expanse: T,
    array: T[`value`][],
    options?: { default?: boolean; ratio?: boolean },
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
    options?: { default?: boolean },
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
    Expanse.set(expanse, (e) => (e.direction *= -1));
  }

  export function unitRange(expanse: Expanse) {
    return expanse.one - expanse.zero;
  }

  export function range(expanse: Expanse) {
    if (!isContinuous(expanse)) {
      throw new Error(`Can only compute range on a continuous expanse`);
    }
    return ExpanseContinuous.range(expanse);
  }

  export function isContinuous(expanse: Expanse): expanse is ExpanseContinuous {
    return expanse.type === Expanse.Type.Continuous;
  }

  export function isPoint(expanse: Expanse): expanse is ExpansePoint {
    return expanse.type === Expanse.Type.Point;
  }
}
