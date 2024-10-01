import { copyProps, copyValues } from "../utils/funs";
import { Poly } from "../utils/Poly";
import { Reactive } from "../utils/Reactive";
import type { ExpanseBand } from "./ExpanseBand";
import type { ExpanseCompound } from "./ExpanseCompound";
import { ExpanseContinuous } from "./ExpanseContinuous";
import type { ExpansePoint } from "./ExpansePoint";
import type { ExpanseSplit } from "./ExpanseSplit";

/** Converts values from some type to the interval [0, 1] and back. */
export interface Expanse<T = any> extends Reactive {
  // Type-level tags
  readonly value: T;
  readonly normalized: number | number[];

  type: Expanse.Type;
  props: Record<string, any>;
  defaults: Record<string, any>;
  frozen: string[];
}

type Val<T extends Expanse> = T[`value`];
type Norm<T extends Expanse> = T[`normalized`];

export namespace Expanse {
  export type Opaque = `value` | `dimensionality`;
  export type Type = `continuous` | `point` | `band` | `compound` | `split`;

  // Polymorphic functions
  export const normalize = Poly.of(normalizeDef);
  export const unnormalize = Poly.of(unnormalizeDefault);
  export const train = Poly.of(trainDefault);
  export const breaks = Poly.of(breaksDefault);
  export const reorder = Poly.of(reorderDefault);

  function normalizeDef<T extends Expanse>(
    expanse: T,
    _value: Val<T>,
  ): Norm<T> {
    throw new Error(
      `Method 'normalize' not implemented for expanse of type '${expanse.type}'`,
    );
  }

  function unnormalizeDefault<T extends Expanse>(
    expanse: T,
    _value: Norm<T>,
  ): Val<T> {
    throw new Error(
      `Method 'unnormalize' not implemented for expanse of type '${expanse.type}'`,
    );
  }

  export function trainDefault<T extends Expanse>(
    expanse: T,
    _array: Val<T>[],
    _options?: { default?: boolean; silent?: boolean },
  ) {
    throw new Error(
      `Method 'train' not implemented for expanse of type '${expanse.type}'`,
    );
  }

  function breaksDefault<T extends Expanse>(
    expanse: T,
    _zero?: number,
    _one?: number,
  ): Val<T>[] {
    throw new Error(
      `Method 'breaks' not implemented for expanse of type '${expanse.type}'`,
    );
  }

  function reorderDefault(expanse: Expanse<string>, _indices?: number[]) {
    throw new Error(
      `Method 'reorder' not implemented for expanse of type '${expanse.type}'`,
    );
  }

  export function base() {
    return Reactive.of()({});
  }

  export function set<T extends Expanse>(
    expanse: T,
    setfn: (props: T[`props`]) => Partial<T[`props`]>,
    options?: { default?: boolean; silent?: boolean; unfreeze?: boolean },
  ) {
    const { frozen, props } = expanse;
    const modified = setfn({ ...props });

    if (!options?.unfreeze) {
      // Frozen properties don't get copied
      for (const k of frozen as (keyof T[`props`])[]) delete modified[k];
    }

    for (const k of Object.keys(modified)) {
      if (modified[k] === expanse.props[k]) delete modified[k];
    }

    copyProps(modified, expanse.props);
    if (!!options?.default) copyProps(modified, expanse.defaults);
    if (!options?.silent) Reactive.dispatch(expanse, `changed`);
  }

  export function freeze<T extends Expanse>(
    expanse: T,
    props: (keyof T[`props`])[],
  ) {
    for (const prop of props as string[]) {
      if (!expanse.frozen.includes(prop)) expanse.frozen.push(prop);
    }
  }

  export function reset<T extends Expanse>(
    expanse: T,
    options?: { silent?: boolean },
  ) {
    const { defaults } = expanse;

    for (const [k, v] of Object.entries(defaults)) {
      if (Array.isArray(v) && Array.isArray(expanse.props[k])) {
        copyValues(v, expanse.props[k]);
      } else expanse.props[k] = v;
    }

    if (!options?.silent) Reactive.dispatch(expanse, `changed`);
  }

  export function isContinuous(expanse: Expanse): expanse is ExpanseContinuous {
    return expanse.type === `continuous` || expanse.type === `split`;
  }

  export function isPoint(expanse: Expanse): expanse is ExpansePoint {
    return expanse.type === `point`;
  }

  export function isDiscrete(
    expanse: Expanse,
  ): expanse is ExpansePoint | ExpanseBand {
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
