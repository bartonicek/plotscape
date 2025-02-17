import { copyProps, copyValues } from "../utils/funs";
import { Polymorphic } from "../utils/Polymorphic";
import { Reactive } from "../utils/Reactive";
import type { ExpanseBand } from "./ExpanseBand";
import type { ExpanseCompound } from "./ExpanseCompound";
import { ExpanseContinuous } from "./ExpanseContinuous";
import type { ExpansePoint } from "./ExpansePoint";
import type { ExpanseSplit } from "./ExpanseSplit";

/** Converts values from some type to the interval [0, 1] and back. */
export interface Expanse<T = any> extends Reactive {
  type: Expanse.Type;
  value: T; // Type-level information only
  normalized: number | number[]; // ^ Same

  props: Record<string, any>;
  defaults: Record<string, any>;
  frozen: string[];
}

export interface ExpanseMethods<T> {
  normalize(expanse: Expanse<T>, value: T): number | number[];
  unnormalize(expanse: Expanse<T>, value: number | number[]): T;
  train(expanse: Expanse<T>, values: T[], options?: Record<string, any>): void;
  breaks(expanse: Expanse<T>, zero?: number, one?: number): T[] | number[];
}

export namespace Expanse {
  export type OpaqueProps = `value` | `dimensionality`;
  export type Type = `continuous` | `point` | `band` | `compound` | `split`;

  export type Value<T extends Expanse> = T[`value`];
  export type Normalized<T extends Expanse> = T[`normalized`];
  export type Props<T extends Expanse> = T[`props`];

  // Polymorphic functions
  export const normalize = Polymorphic.of(normalizeDefault);
  export const unnormalize = Polymorphic.of(unnormalizeDefault);
  export const train = Polymorphic.of(trainDefault);
  export const breaks = Polymorphic.of(breaksDefault);
  export const reorder = Polymorphic.of(reorderDefault);
  export const reset = Polymorphic.of(resetDefault);

  function normalizeDefault<T extends Expanse>(
    expanse: T,
    _value: Value<T>,
  ): Normalized<T> {
    throw Polymorphic.error(`normalize`, `expanse`, expanse.type);
  }

  function unnormalizeDefault<T extends Expanse>(
    expanse: T,
    _value: Normalized<T>,
  ): Value<T> {
    throw Polymorphic.error(`unnormalize`, `expanse`, expanse.type);
  }

  export function trainDefault<T extends Expanse>(
    expanse: T,
    _values: Value<T>[],
    _options?: { default?: boolean; silent?: boolean },
  ) {
    throw Polymorphic.error(`train`, `expanse`, expanse.type);
  }

  function breaksDefault<T extends Expanse>(
    expanse: T,
    _zero?: number,
    _one?: number,
  ): Value<T>[] {
    throw Polymorphic.error(`breaks`, `expanse`, expanse.type);
  }

  export function resetDefault<T extends Expanse>(
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

  function reorderDefault(expanse: Expanse<string>, _indices?: number[]) {
    throw Polymorphic.error(`reorder`, `expanse`, expanse.type);
  }

  export function base() {
    return Reactive.of()({});
  }

  export function set<T extends Expanse>(
    expanse: T,
    setfn: (props: Props<T>) => Partial<Props<T>>,
    options?: { default?: boolean; silent?: boolean; unfreeze?: boolean },
  ) {
    const { frozen, props } = expanse;
    const modified = setfn({ ...props });

    if (!options?.unfreeze) {
      // Frozen properties don't get copied
      for (const k of frozen as (keyof Props<T>)[]) delete modified[k];
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
    props: (keyof Props<T>)[],
  ) {
    for (const prop of props as string[]) {
      if (!expanse.frozen.includes(prop)) expanse.frozen.push(prop);
    }
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

  export function isUnivariate(
    expanse: Expanse,
  ): expanse is ExpanseContinuous | ExpansePoint | ExpanseBand {
    return !isCompound(expanse) && !isSplit(expanse);
  }
}
