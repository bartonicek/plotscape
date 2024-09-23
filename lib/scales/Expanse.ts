import { copyProps, copyValues, invertRange } from "../utils/funs";
import { Poly } from "../utils/Poly";
import { Reactive } from "../utils/Reactive";
import { Direction, Entries } from "../utils/types";
import type { ExpanseBand } from "./ExpanseBand";
import type { ExpanseCompound } from "./ExpanseCompound";
import type { ExpanseContinuous } from "./ExpanseContinuous";
import type { ExpansePoint } from "./ExpansePoint";
import type { ExpanseSplit } from "./ExpanseSplit";

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

export namespace Expanse {
  export type Type = `continuous` | `point` | `band` | `compound` | `split`;

  // Polymorphic functions
  export const normalize = Poly.of(normalizeDefault);
  export const unnormalize = Poly.of(unnormalizeDefault);
  export const train = Poly.of(trainDefault);
  export const breaks = Poly.of(breaksDefault);
  export const reorder = Poly.of(reorderDefault);

  function normalizeDefault<T extends Expanse>(
    expanse: T,
    // @ts-ignore - Need to infer function signatures
    value: T[`value`],
  ): number {
    throw new Error(
      `Method 'normalize' not implemented for expanse of type '${expanse.type}'`,
    );
  }

  function unnormalizeDefault<T extends Expanse>(
    expanse: T,
    // @ts-ignore
    value: number,
  ): T[`value`] {
    throw new Error(
      `Method 'unnormalize' not implemented for expanse of type '${expanse.type}'`,
    );
  }

  export function trainDefault<T extends Expanse>(
    expanse: T,
    // @ts-ignore
    array: T[`value`][],
    // @ts-ignore
    options?: { default?: boolean; silent?: boolean },
  ) {
    throw new Error(
      `Method 'train' not implemented for expanse of type '${expanse.type}'`,
    );
  }

  function breaksDefault<T extends Expanse>(expanse: T): T[`value`][] {
    throw new Error(
      `Method 'breaks' not implemented for expanse of type '${expanse.type}'`,
    );
  }

  // @ts-ignore
  function reorderDefault(expanse: Expanse<string>, indices?: number[]) {
    throw new Error(
      `Method 'reorder' not implemented for expanse of type '${expanse.type}'`,
    );
  }

  export function base(options?: {
    zero?: number;
    one?: number;
    direction?: Direction;
  }) {
    const zero = options?.zero ?? 0;
    const one = options?.one ?? 1;
    const direction = options?.direction ?? 1;
    const frozen = [] as string[];
    const linked = [] as Expanse[];
    const defaults = { zero, one, direction };

    return Reactive.of()({ zero, one, direction, frozen, linked, defaults });
  }

  export function set<T extends Expanse>(
    expanse: T,
    setfn: (expanse: T & { [key in string]: any }) => void,
    options?: { default?: boolean; silent?: boolean; unfreeze?: boolean },
  ) {
    const { linked, frozen } = expanse;
    const modified = { ...expanse };
    setfn(modified);

    if (!options?.unfreeze) {
      // Frozen properties don't get copied
      for (const k of frozen as (keyof T)[]) delete modified[k];
    }

    for (const k of Object.keys(modified) as (keyof T)[]) {
      if (modified[k] === expanse[k]) delete modified[k];
    }

    copyProps(modified, expanse);

    for (const l of linked) Expanse.set(l as T, setfn);

    if (!!options?.default) copyProps(modified, expanse.defaults);
    if (!options?.silent) Reactive.dispatch(expanse, `changed`);
  }

  export function freeze<T extends Expanse>(expanse: T, props: (keyof T)[]) {
    for (const prop of props as string[]) {
      if (!expanse.frozen.includes(prop)) expanse.frozen.push(prop);
    }
  }

  export function linkTo<T extends Expanse>(expanse: T, other: T) {
    if (!expanse.linked.includes(other)) expanse.linked.push(other);
  }

  export function reset<T extends Expanse>(expanse: T) {
    const { defaults } = expanse;

    for (const [k, v] of Object.entries(defaults) as Entries<T>) {
      if (Array.isArray(v) && Array.isArray(expanse[k])) {
        copyValues(v, expanse[k]);
      } else expanse[k] = v;
    }

    Reactive.dispatch(expanse, `changed`);
  }

  export function move(expanse: Expanse, amount: number) {
    const { direction: d } = expanse;
    const amt = amount;
    Expanse.set(expanse, (e) => ((e.zero += d * amt), (e.one += d * amt)));
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
    if (direction === -1) [zero, one] = [1 - zero, 1 - one];

    // Normalize the zoom values within the current range
    let [nZero, nOne] = [zero, one].map((x) => (x - currZero) / currRange);
    [nZero, nOne] = invertRange(nZero, nOne);

    // Finally, reflect again
    if (direction === -1) {
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

  export function isContinuous(expanse: Expanse): expanse is ExpanseContinuous {
    return expanse.type === `continuous` || expanse.type === `split`;
  }

  export function isPoint(expanse: Expanse): expanse is ExpansePoint {
    return expanse.type === `point`;
  }

  export function isDiscrete(expanse: Expanse) {
    return expanse.type === `point` || expanse.type === `band`;
  }

  export function isBand(expanse: Expanse): expanse is ExpanseBand {
    return expanse.type === `band`;
  }

  export function isCompound(expanse: Expanse): expanse is ExpanseCompound {
    return expanse.type === `compound`;
  }

  export function isSplit(expanse: Expanse): expanse is ExpanseSplit {
    return expanse.type === `split`;
  }
}
