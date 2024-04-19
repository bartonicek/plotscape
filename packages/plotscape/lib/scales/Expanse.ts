import { invertRange, noopThis } from "utils";
import { Named } from "../mixins/Named";
import { Observable, untrack } from "../mixins/Observable";
import { Direction } from "../types";
import { Widget } from "../widgets/Widget";
import { ExpanseContinuous } from "./ExpanseContinuous";
import { ExpanseDiscreteAbsolute } from "./ExpanseDiscreteAbsolute";
import { ExpanseDiscreteWeighted } from "./ExpanseDiscreteWeighted";

export enum ExpanseType {
  Continuous = `ExpanseContinuous`,
  DiscreteAbsolute = `ExpanseDiscreteAbsolute`,
  DiscreteWeighted = `ExpanseDiscreteWeighted`,
}

/** Can normalize values from type `T` to `[0, 1]`
 * and unnormalize values from `[0, 1]`to `T`.  */
export interface Expanse<T = unknown> extends Named, Observable {
  zero: number;
  one: number;
  defaultZero: number;
  defaultOne: number;
  direction: Direction;

  normalize(value: T): number;
  unnormalize(value: number): T;

  clone(): Expanse<T>;
  defaultize(options?: Record<string, any>): this;

  setZero(zero: number, options?: { default?: boolean }): this;
  setOne(one: number, options?: { default?: boolean }): this;
  setZeroOne(zero: number, one: number, options?: { default?: boolean }): this;
  freezeZero(): this;
  freezeOne(): this;
  freeze(): this;

  expand(zero: number, one: number, options?: { default?: boolean }): this;
  move(amount: number, options?: { default?: boolean }): this;
  link(other: Expanse): this;
  retrain(array: T[]): void;
  breaks(): T[];
  widget(): Widget | undefined;

  [Symbol.toStringTag]: string;
}

export function isExpanseContinuous(
  expanse: Expanse
): expanse is ExpanseContinuous {
  return expanse[Symbol.toStringTag] === ExpanseType.Continuous;
}

export function isExpanseDiscrete(
  expanse: Expanse
): expanse is ExpanseDiscreteAbsolute | ExpanseDiscreteWeighted {
  return (
    expanse[Symbol.toStringTag] === ExpanseType.DiscreteAbsolute ||
    expanse[Symbol.toStringTag] === ExpanseType.DiscreteWeighted
  );
}

export function isExpanseDiscreteWeighted(
  expanse: Expanse
): expanse is ExpanseDiscreteWeighted {
  return expanse[Symbol.toStringTag] === ExpanseType.DiscreteWeighted;
}

export function setZero<T extends Expanse>(
  this: T,
  value: number,
  options?: { default?: boolean }
) {
  this.zero = value;
  if (options?.default) this.defaultZero = value;
  this.emit();
  return this;
}

export function setOne<T extends Expanse>(
  this: T,
  value: number,
  options?: { default?: boolean }
) {
  this.one = value;
  if (options?.default) this.defaultOne = value;
  this.emit();
  return this;
}

export function setZeroOne<T extends Expanse>(
  this: T,
  zero: number,
  one: number,
  options?: { default?: boolean }
) {
  untrack(this, () => this.setZero(zero, options).setOne(one, options));
  this.emit();
  return this;
}

export function freezeZero<T extends Expanse>(this: T) {
  this.setZero = noopThis;
  return this;
}

export function freezeOne<T extends Expanse>(this: T) {
  this.setOne = noopThis;
  return this;
}

export function freeze<T extends Expanse>(this: T) {
  return this.freezeZero().freezeOne();
}

export function link<T extends Expanse>(this: T, other: Expanse) {
  const expand = this.expand.bind(this);
  const move = this.move.bind(this);
  const defaultize = this.defaultize.bind(this);

  this.expand = (zero, one) => {
    expand(zero, one);
    other.expand(zero, one);
    return this;
  };

  this.move = (amount) => {
    move(amount);
    other.move(amount);
    return this;
  };

  this.defaultize = (options: Record<string, any>) => {
    defaultize(options);
    other.defaultize(options);
    return this;
  };

  if (isExpanseContinuous(this) && isExpanseContinuous(other)) {
    const flip = this.flip.bind(this);
    this.flip = () => {
      flip();
      other.flip();
      return this;
    };
  }

  return this;
}

export function move<T extends Expanse>(
  this: T,
  amount: number,
  options?: { default?: boolean }
) {
  const zero = this.zero + amount;
  const one = this.one + amount;
  untrack(this, () => this.setZeroOne(zero, one, options));

  this.emit();
  return this;
}

export function expand<T extends Expanse>(
  this: T,
  zero: number,
  one: number,
  options?: { default?: boolean }
) {
  // First, get current zero and current range
  const { zero: cZero, one: cOne, direction } = this;
  const cRange = cOne - cZero;

  // Reflect if direction is backwards
  if (direction === Direction.Backward) {
    [zero, one] = [1 - zero, 1 - one];
  }

  // Normalize the zoom values within the current range
  let [nZero, nOne] = [zero, one].map((x) => (x - cZero) / cRange);

  // Invert
  [nZero, nOne] = invertRange(nZero, nOne);

  // Finally, reflect again
  if (direction === Direction.Backward) {
    [nZero, nOne] = [1 - nZero, 1 - nOne];
  }

  untrack(this, () => this.setZeroOne(nZero, nOne, options));
  this.emit();

  return this;
}
