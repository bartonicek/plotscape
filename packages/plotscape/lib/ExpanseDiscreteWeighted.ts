import {
  compareAlphaNumeric,
  cumsum,
  last,
  noopThis,
  rep,
  seq,
  subsetOnIndices,
} from "utils";
import { Expanse } from "./Expanse";
import { orderByIndices } from "./funs";
import { Emitter, subscribable } from "./mixins/Emitter";
import { DragListWidget, newDragListWidget } from "./widgets/DragListWidget";

/* -------------------------------- Interface ------------------------------- */

export interface ExpanseDiscreteWeighted
  extends Expanse<string>,
    Emitter<"changed"> {
  order: number[];
  values: string[];
  weights: number[];
  cumWeights: number[];
  width(value: string): number;
  setOrder(indices: number[]): this;
  setValues(values: string[]): this;
  setWeights(weights: number[]): this;
  setDefaultWeights(): this;
  setDefaultOrder(): this;
  getWidthExpanse(): ExpanseDiscreteWeighted;
  retrain(array: string[]): this;
  clone(): ExpanseDiscreteWeighted;

  widget(): DragListWidget;
}

/* ------------------------------- Constructor ------------------------------ */

export function newExpanseDiscreteWeighted(
  values: string[]
): ExpanseDiscreteWeighted {
  const order = seq(0, values.length - 1);
  const weights = rep(1, values.length);
  const cumWeights = cumsum(weights);

  const props = { order, values, weights, cumWeights };
  const methods = {
    clone,
    normalize,
    unnormalize,
    width,
    setValues,
    setWeights,
    setOrder,
    setDefaultWeights,
    setDefaultOrder,
    getWidthExpanse,
    retrain,
    breaks,
    widget,
  };

  const self = { ...props, ...methods };

  return subscribable(self);
}

/* --------------------------------- Methods -------------------------------- */

function normalize(this: ExpanseDiscreteWeighted, value: string) {
  const [lower, upper, max] = getBoundsInternal(this, value);
  const midpoint = lower + (upper - lower) / 2;
  return midpoint / max;
}

function unnormalize(this: ExpanseDiscreteWeighted, value: number) {
  throw new Error(`Not implemented yet`);
  return this.values[0];
}

function width(this: ExpanseDiscreteWeighted, value: string) {
  const [lower, upper, max] = getBoundsInternal(this, value);
  return (upper - lower) / max;
}

function getWidthExpanse(this: ExpanseDiscreteWeighted) {
  const copy = { ...this };
  copy.normalize = this.width;
  copy.clone = noopThis.bind(copy);
  return copy;
}

function setValues(this: ExpanseDiscreteWeighted, values: string[]) {
  for (let i = 0; i < values.length; i++) this.values[i] = values[i];
  this.emit(`changed`);
  return this;
}

function setWeights(this: ExpanseDiscreteWeighted, weights: number[]) {
  const cumWeights = cumsum(subsetOnIndices(weights, this.order));

  for (let i = 0; i < weights.length; i++) this.weights[i] = weights[i];
  for (let i = 0; i < cumWeights.length; i++) {
    this.cumWeights[i] = cumWeights[i];
  }

  this.emit(`changed`);
  return this;
}

function setOrder(this: ExpanseDiscreteWeighted, indices: number[]) {
  for (let i = 0; i < indices.length; i++) this.order[i] = indices[i];

  const cumWeights = cumsum(orderByIndices(this.weights, this.order));
  for (let i = 0; i < cumWeights.length; i++) {
    this.cumWeights[i] = cumWeights[i];
  }

  this.emit(`changed`);
  return this;
}

function setDefaultWeights(this: ExpanseDiscreteWeighted) {
  this.weights.fill(1);
  for (let i = 0; i < this.cumWeights.length; i++) this.cumWeights[i] = i + 1;
  this.emit(`changed`);
  return this;
}

function setDefaultOrder(this: ExpanseDiscreteWeighted) {
  for (let i = 0; i < this.order.length; i++) this.order[i] = i;

  const cumWeights = cumsum(orderByIndices(this.weights, this.order));
  for (let i = 0; i < cumWeights.length; i++) {
    this.cumWeights[i] = cumWeights[i];
  }

  this.emit(`changed`);
  return this;
}

function retrain(this: ExpanseDiscreteWeighted, array: string[]) {
  const values = Array.from(new Set(array)).sort(compareAlphaNumeric);
  const weights = rep(1, values.length);
  const cumWeights = cumsum(weights);

  this.values = values;
  this.weights = weights;
  this.cumWeights = cumWeights;
  this.emit(`changed`);

  return this;
}

function clone(this: ExpanseDiscreteWeighted) {
  const copy = newExpanseDiscreteWeighted(this.values);
  copy.order = this.order;
  copy.weights = this.weights;
  copy.cumWeights = this.cumWeights;
  copy.normalize = this.normalize;
  return copy;
}

function breaks(this: ExpanseDiscreteWeighted) {
  return orderByIndices(this.values, this.order);
}

function getBoundsInternal(self: ExpanseDiscreteWeighted, value: string) {
  const { order, values, cumWeights } = self;
  const index = order[values.indexOf(value)];
  return [cumWeights[index - 1] ?? 0, cumWeights[index], last(cumWeights)];
}

function widget(this: ExpanseDiscreteWeighted) {
  const widget = newDragListWidget([...this.values]);
  return widget;
}
