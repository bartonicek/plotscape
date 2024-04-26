import { compareAlphaNumeric, seq } from "utils";
import { mix } from "../funs";
import { named } from "../mixins/Named";
import { Observable, observable } from "../mixins/Observable";
import { Direction } from "../types";
import { DragListWidget } from "../widgets/DragListWidget";
import {
  Expanse,
  ExpanseType,
  expand,
  flip,
  freeze,
  freezeOne,
  freezeZero,
  link,
  move,
  setOne,
  setZero,
  setZeroOne,
} from "./Expanse";
import { ExpanseDiscrete, breaks, setValues, widget } from "./ExpanseDiscrete";

/** Can normalize values from `string[]` to `[0, 1]` and vice versa.
 * Values are placed at equidistant place covering the whole of `[0, 1]`.
 *
 * Example: `[a, b, c, d] -> [0, 0.333, 0.666, 1].`
 *  */
export interface ExpanseDiscreteAbsolute
  extends Expanse<string>,
    ExpanseDiscrete,
    Observable {
  order: number[];
  values: string[];

  clone(): this;
  normalize(value: string): number;
  unnormalize(value: number): string;
  defaultize(options?: {
    zero?: boolean;
    one?: boolean;
    order?: boolean;
  }): this;

  setValues(values: string[]): this;
  setOrder(indices: number[]): this;
  setDefaultOrder(): this;

  link(other: Expanse): this;
  retrain(array: string[]): this;
  breaks(): string[];
  widget(): DragListWidget;
  [Symbol.toStringTag]: string;
}

export function newExpanseDiscreteAbsolute(
  values: string[]
): ExpanseDiscreteAbsolute {
  const order = seq(0, values.length - 1);
  const [zero, one, defaultZero, defaultOne] = [0, 1, 0, 1];
  const direction = Direction.Forward;

  const props = {
    order,
    values,
    zero,
    one,
    defaultZero,
    defaultOne,
    direction,
    [Symbol.toStringTag]: ExpanseType.DiscreteAbsolute,
  };

  const methods = {
    clone,
    copyFrom,
    matches,
    normalize,
    unnormalize,
    defaultize,
    setZero,
    setOne,
    setZeroOne,
    setValues,
    setOrder,
    setDefaultOrder,
    link,
    freezeZero,
    freezeOne,
    freeze,
    expand,
    move,
    flip,
    retrain,
    breaks,
    widget,
  };

  const self = { ...props, ...methods };
  return mix(self).with(named).with(observable);
}

function clone(this: ExpanseDiscreteAbsolute) {
  const copy = newExpanseDiscreteAbsolute(this.values);
  copy.order = this.order;
  copy.normalize = this.normalize;
  return copy;
}

function copyFrom(
  this: ExpanseDiscreteAbsolute,
  other: ExpanseDiscreteAbsolute
) {
  for (let i = 0; i < other.values.length; i++) {
    this.values[i] = other.values[i];
    this.order[i] = other.order[i];
  }
  return this;
}

function matches(this: ExpanseDiscreteAbsolute, other: Expanse) {
  return isExpanseDiscreteAbsolute(other);
}

function normalize(this: ExpanseDiscreteAbsolute, value: string) {
  const { order, values, zero, one, direction: dir } = this;
  let normalized = order[values.indexOf(value)] / (values.length - 1);
  normalized = zero + normalized * (one - zero);
  return dir + (-2 * dir + 1) * normalized;
}

function unnormalize(this: ExpanseDiscreteAbsolute, _: number) {
  throw new Error(`Not implemented yet`);
  return this.values[0];
}

function defaultize<T extends ExpanseDiscreteAbsolute>(
  this: T,
  options?: { zero?: boolean; one?: boolean; order?: boolean }
) {
  const opts = Object.assign({ zero: true, one: true, order: true }, options);

  if (opts.zero) this.zero = this.defaultZero;
  if (opts.one) this.one = this.defaultOne;
  if (opts.order) {
    for (let i = 0; i < this.order.length; i++) this.order[i] = i;
  }

  this.emit();
  return this;
}

function setOrder<T extends ExpanseDiscreteAbsolute>(
  this: T,
  indices: number[]
) {
  for (let i = 0; i < indices.length; i++) this.order[i] = indices[i];
  this.emit();
  return this;
}

function setDefaultOrder<T extends ExpanseDiscreteAbsolute>(this: T) {
  for (let i = 0; i < this.order.length; i++) this.order[i] = i;
  this.emit();
  return this;
}

function retrain<T extends ExpanseDiscreteAbsolute>(this: T, array: string[]) {
  const values = Array.from(new Set(array)).sort(compareAlphaNumeric);
  this.values = values;
  this.emit();
  return this;
}

function isExpanseDiscreteAbsolute(expanse: Expanse) {
  return expanse[Symbol.toStringTag] === ExpanseType.DiscreteWeighted;
}
