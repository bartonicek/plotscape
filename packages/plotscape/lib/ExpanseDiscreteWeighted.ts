import { compareAlphaNumeric, cumsum, last, rep } from "utils";
import { Expanse } from "./Expanse";
import { Emitter, subscribable } from "./mixins/Emitter";

/* -------------------------------- Interface ------------------------------- */

export interface ExpanseDiscreteWeighted
  extends Expanse<string>,
    Emitter<"changed"> {
  values: string[];
  weights: number[];
  cumWeights: number[];
  width(value: string): number;
  setValues(values: string[]): this;
  setWeights(weights: number[]): this;
  retrain(array: string[]): this;
  clone(): ExpanseDiscreteWeighted;
}

/* ------------------------------- Constructor ------------------------------ */

export function newExpanseDiscreteWeighted(
  values: string[]
): ExpanseDiscreteWeighted {
  const weights = rep(1, values.length);
  const cumWeights = cumsum(weights);

  const props = { values, weights, cumWeights };
  const methods = {
    clone,
    normalize,
    unnormalize,
    width,
    setValues,
    setWeights,
    retrain,
    breaks,
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

function setValues(this: ExpanseDiscreteWeighted, values: string[]) {
  this.values = values;
  this.emit(`changed`);
  return this;
}

function setWeights(this: ExpanseDiscreteWeighted, weights: number[]) {
  this.weights = weights;
  this.cumWeights = cumsum(weights);
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
  return newExpanseDiscreteWeighted(this.values);
}

function breaks(this: ExpanseDiscreteWeighted) {
  return this.values;
}

function getBoundsInternal(self: ExpanseDiscreteWeighted, value: string) {
  const { values, cumWeights } = self;
  const index = values.indexOf(value);
  return [cumWeights[index - 1] ?? 0, cumWeights[index], last(cumWeights)];
}
