import { minMax } from "utils";
import { Expanse } from "./Expanse";
import { Emitter, subscribable } from "./mixins/Emitter";

export interface ExpanseContinuous
  extends Expanse<number>,
    Emitter<"limitschanged"> {
  min: number;
  max: number;
  source?: number[];
  range(): number;
  normalize(value: number): number;
  unnormalize(value: number): number;
  setMin(value: number): this;
  setMax(value: number): this;
  registerSource(values: number[]): this;
  retrain(): this;
}

export function newExpanseContinuous(min = 0, max = 1): ExpanseContinuous {
  const self = {
    min,
    max,
    range,
    normalize,
    unnormalize,
    setMin,
    setMax,
    registerSource,
    retrain,
  };

  return subscribable(self);
}

function range(this: ExpanseContinuous) {
  return this.max - this.min;
}

function normalize(this: ExpanseContinuous, value: number) {
  return (value - this.min) / this.range();
}

function unnormalize(this: ExpanseContinuous, value: number) {
  return this.min + value * this.range();
}

function setMin(this: ExpanseContinuous, value: number) {
  this.min = value;
  this.emit("limitschanged");
  return this;
}

function setMax(this: ExpanseContinuous, value: number) {
  this.max = value;
  this.emit("limitschanged");
  return this;
}

function registerSource(this: ExpanseContinuous, values: number[]) {
  this.source = values;
  this.retrain();
  return this;
}

function retrain(this: ExpanseContinuous) {
  if (!this.source) return this;

  const [min, max] = minMax(this.source);
  this.setMin(min).setMax(max);

  return this;
}
