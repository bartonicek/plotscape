import { compareAlphaNumeric, cumsum, last, noopThis, rep, seq } from "utils";
import { mix, orderByIndices } from "../funs";
import { named } from "../mixins/Named";
import { observable } from "../mixins/Observable";
import { Direction } from "../types";
import { DragListWidget } from "../widgets/DragListWidget";
import {
  Expanse,
  ExpanseType,
  expand,
  freeze,
  freezeOne,
  freezeZero,
  move,
  setOne,
  setZero,
  setZeroOne,
} from "./Expanse";
import { ExpanseDiscreteAbsolute } from "./ExpanseDiscreteAbsolute";
import { breaks, link, setValues, widget } from "./discreteMethods";

/* -------------------------------- Interface ------------------------------- */

/** Can normalize values from `string[]` to `[0, 1]` and vice versa.
 * Values are places in the center of bins along `[0, 1]`. The bins
 * can be assigned weights such that the width of the bin is proportional
 * to its weight.
 *
 * Example with no weights: `[a, b, c, d] -> [0.125, 0.375, 0.625, 0.875]`
 * (binwidth = 0.125 * 2)
 *
 * Example with weights `[1, 1, 1, 5]`: `[a, b, c, d] -> [0.0625, 0.1875, 0.3125, 0.6875]`
 *
 *  */
export interface ExpanseDiscreteWeighted extends ExpanseDiscreteAbsolute {
  order: number[];
  values: string[];
  weights: number[];
  cumWeights: number[];

  clone(): this;
  normalize(value: string): number;
  unnormalize(value: number): string;
  width(value: string): number;
  defaultize(options?: {
    zero?: boolean;
    one?: boolean;
    order?: boolean;
  }): this;

  setValues(values: string[]): this;
  setOrder(indices: number[]): this;
  setWeights(weights: number[]): this;
  setDefaultWeights(): this;
  setDefaultOrder(): this;

  link(other: Expanse): this;
  retrain(array: string[]): this;
  retrain(array: string[]): this;
  breaks(): string[];
  widget(): DragListWidget;
  getWidthExpanse(): ExpanseDiscreteWeighted;
  [Symbol.toStringTag]: string;
}

/* ------------------------------- Constructor ------------------------------ */

export function newExpanseDiscreteWeighted(
  values: string[]
): ExpanseDiscreteWeighted {
  const order = seq(0, values.length - 1);
  const weights = rep(1, values.length);
  const cumWeights = cumsum(weights);
  const [zero, one, defaultZero, defaultOne] = [0, 1, 0, 1];
  const direction = Direction.Forward;

  const props = {
    order,
    values,
    weights,
    zero,
    one,
    defaultZero,
    defaultOne,
    direction,
    cumWeights,
    [Symbol.toStringTag]: ExpanseType.DiscreteWeighted,
  };

  const methods = {
    clone,
    copyFrom,
    matches,
    normalize,
    unnormalize,
    defaultize,
    width,
    setZero,
    setOne,
    setZeroOne,
    setValues,
    setWeights,
    setOrder,
    freezeZero,
    freezeOne,
    freeze,
    link,
    expand,
    move,
    setDefaultWeights,
    setDefaultOrder,
    getWidthExpanse,
    retrain,
    breaks,
    widget,
  };

  const self = { ...props, ...methods };
  return mix(self).with(named).with(observable);
}

/* --------------------------------- Methods -------------------------------- */

function clone(this: ExpanseDiscreteWeighted) {
  const copy = newExpanseDiscreteWeighted(this.values);
  copy.order = this.order;
  copy.weights = this.weights;
  copy.cumWeights = this.cumWeights;
  copy.normalize = this.normalize;
  return copy;
}

function copyFrom(
  this: ExpanseDiscreteWeighted,
  other: ExpanseDiscreteWeighted
) {
  for (let i = 0; i < other.values.length; i++) {
    this.values[i] = other.values[i];
    this.order[i] = other.order[i];
    this.weights[i] = other.weights[i];
  }
  return this;
}

function matches(this: ExpanseDiscreteWeighted, other: Expanse) {
  return isExpanseDiscreteWeighted(other);
}

function normalize(this: ExpanseDiscreteWeighted, value: string) {
  const { zero, one } = this;
  const [lower, upper, max] = getBounds(this, value);
  const midpoint = lower + (upper - lower) / 2;
  const normalized = midpoint / max;
  return zero + normalized * (one - zero);
}

function unnormalize(this: ExpanseDiscreteWeighted, _: number) {
  throw new Error(`Not implemented yet`);
  return this.values[0];
}

function defaultize<T extends ExpanseDiscreteWeighted>(
  this: T,
  options?: {
    zero?: boolean;
    one?: boolean;
    order?: boolean;
    weights?: boolean;
  }
) {
  const opts = Object.assign(
    { zero: true, one: true, order: true, weights: true },
    options
  );

  if (opts.zero) this.zero = this.defaultZero;
  if (opts.one) this.one = this.defaultOne;

  if (opts.weights) this.weights.fill(1);
  if (opts.order) {
    for (let i = 0; i < this.order.length; i++) this.order[i] = i;
  }

  if (opts.weights || opts.order) updateCumWeights(this);

  this.emit();
  return this;
}

function width(this: ExpanseDiscreteWeighted, value: string) {
  const { zero, one } = this;
  const [lower, upper, max] = getBounds(this, value);
  return ((upper - lower) / max) * (one - zero);
}

function getWidthExpanse(this: ExpanseDiscreteWeighted) {
  const copy = { ...this };
  copy.normalize = this.width;
  copy.clone = noopThis.bind(copy);
  return copy;
}

function setWeights(this: ExpanseDiscreteWeighted, weights: number[]) {
  for (let i = 0; i < weights.length; i++) this.weights[i] = weights[i];
  updateCumWeights(this);
  this.emit();
  return this;
}

function setOrder(this: ExpanseDiscreteWeighted, indices: number[]) {
  for (let i = 0; i < indices.length; i++) this.order[i] = indices[i];
  updateCumWeights(this);
  this.emit();
  return this;
}

function setDefaultWeights(this: ExpanseDiscreteWeighted) {
  this.weights.fill(1);
  updateCumWeights(this);
  this.emit();
  return this;
}

function setDefaultOrder(this: ExpanseDiscreteWeighted) {
  for (let i = 0; i < this.order.length; i++) this.order[i] = i;
  updateCumWeights(this);
  this.emit();
  return this;
}

function retrain(this: ExpanseDiscreteWeighted, array: string[]) {
  const values = Array.from(new Set(array)).sort(compareAlphaNumeric);
  const weights = rep(1, values.length);
  const cumWeights = cumsum(weights);

  this.values = values;
  this.weights = weights;
  this.cumWeights = cumWeights;
  this.emit();

  return this;
}

function getBounds(self: ExpanseDiscreteWeighted, value: string) {
  const { order, values, cumWeights } = self;
  const index = order[values.indexOf(value)];
  return [cumWeights[index - 1] ?? 0, cumWeights[index], last(cumWeights)];
}

function updateCumWeights(self: ExpanseDiscreteWeighted) {
  // const { weights, cumWeights, order } = self;

  // cumWeights[0] = weights[order[0]];
  // for (let i = 1; i < order.length; i++) {
  //   cumWeights[i] = cumWeights[i - 1] + weights[order[i]];
  // }

  const cumWeights = cumsum(orderByIndices(self.weights, self.order));
  for (let i = 0; i < cumWeights.length; i++) {
    self.cumWeights[i] = cumWeights[i];
  }
}
export function isExpanseDiscreteWeighted(
  expanse: Expanse
): expanse is ExpanseDiscreteWeighted {
  return expanse[Symbol.toStringTag] === ExpanseType.DiscreteWeighted;
}
